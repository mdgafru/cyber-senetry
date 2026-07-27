import { getAdminClient } from '../supabase/admin';
import { generateWithClaude, parseGeneratedJSON, resolveAnthropicModel, DEFAULT_ANTHROPIC_MODEL } from '../anthropic';
import {
  buildSystemPrompt,
  buildArticlePrompt,
  buildTopicPrompt,
  buildManualGeneratePrompt,
} from './prompts';
import { buildCombinedSchema, imageFilename, webpFilename } from './seo';
import { sanitizeSeoFields } from './meta';
import { sanitizeArticleMarkdown } from './markdown-inline';
import { slugify, calcReadingTime } from '../posts';
import { fetchUnsplashHeroImage, photoIdFromUrl } from '../unsplash';
import type { AutomationSettings, GeneratedArticle, Post, Service } from '../types';

const DEFAULT_SETTINGS: AutomationSettings = {
  enabled: true,
  daily_time: '06:00',
  articles_per_day: 1,
  ai_model: DEFAULT_ANTHROPIC_MODEL,
  temperature: 0.85,
  max_tokens: 16000,
  retry_count: 3,
  publishing_delay_minutes: 0,
  prompt_template: 'default',
  site_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  site_name: 'cybersentry360',
  author_name: 'cybersentry360 Editorial',
  geo: {
    country: 'United States',
    state: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    region: 'US-CA',
    business_area: 'Bay Area & nationwide',
  },
};

export async function getAutomationSettings(): Promise<AutomationSettings> {
  const db = getAdminClient();
  const { data } = await db.from('settings').select('value').eq('key', 'automation').single();
  const merged = { ...DEFAULT_SETTINGS, ...(data?.value as Partial<AutomationSettings> || {}) };
  merged.ai_model = resolveAnthropicModel(merged.ai_model);
  return merged;
}

export async function updateAutomationSettings(partial: Partial<AutomationSettings>) {
  const current = await getAutomationSettings();
  const merged = { ...current, ...partial };
  if (merged.ai_model) merged.ai_model = resolveAnthropicModel(merged.ai_model);
  const db = getAdminClient();
  await db.from('settings').upsert({ key: 'automation', value: merged, updated_at: new Date().toISOString() });
  return merged;
}

export async function getNextService(): Promise<Service | null> {
  const db = getAdminClient();
  const { data: services } = await db
    .from('services')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (!services?.length) return null;

  // Round-robin: pick service with oldest last_generated_at (null first)
  const sorted = [...services].sort((a, b) => {
    if (!a.last_generated_at && !b.last_generated_at) return a.priority - b.priority;
    if (!a.last_generated_at) return -1;
    if (!b.last_generated_at) return 1;
    return new Date(a.last_generated_at).getTime() - new Date(b.last_generated_at).getTime();
  });

  return sorted[0] as Service;
}

export async function getUsedTopics(serviceId: string): Promise<string[]> {
  const db = getAdminClient();
  const { data } = await db
    .from('prompt_history')
    .select('topic')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data || []).map((r) => r.topic);
}

export async function generateUniqueTopic(service: Service, settings: AutomationSettings): Promise<{ topic: string; angle: string }> {
  const usedTopics = await getUsedTopics(service.id);
  const system = buildSystemPrompt(settings);

  for (let attempt = 0; attempt < 3; attempt++) {
    const { text } = await generateWithClaude({
      system,
      user: buildTopicPrompt(service, usedTopics),
      model: settings.ai_model,
      temperature: settings.temperature,
      maxTokens: 1024,
    });

    try {
      const parsed = JSON.parse(text.replace(/```json?\s*|\s*```/g, '').trim().match(/\{[\s\S]*\}/)?.[0] || text);
      if (parsed.topic && !usedTopics.some((t) => t.toLowerCase() === parsed.topic.toLowerCase())) {
        return { topic: parsed.topic, angle: parsed.angle || '' };
      }
    } catch {
      // retry
    }
  }

  // Fallback: timestamped unique topic
  const fallback = `${service.name} Security Insights: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Analysis`;
  return { topic: fallback, angle: 'Monthly industry analysis' };
}

async function getInternalLinkTargets(excludeServiceSlug: string) {
  const db = getAdminClient();
  const targets: { name: string; slug: string; type: string }[] = [];

  const { data: services } = await db.from('services').select('name, slug').eq('enabled', true);
  for (const s of services || []) {
    if (s.slug !== excludeServiceSlug) {
      targets.push({ name: s.name, slug: s.slug, type: 'category' });
    }
  }

  const { data: recentPosts } = await db
    .from('posts')
    .select('title, slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5);

  for (const p of recentPosts || []) {
    targets.push({ name: p.title, slug: p.slug, type: 'article' });
  }

  targets.push({ name: 'Search Archive', slug: '', type: 'search' });
  return targets.slice(0, 10);
}

async function getUsedHeroPhotoIds(excludePostId?: string) {
  const db = getAdminClient();
  const { data } = await db.from('posts').select('id, featured_image');
  const used = new Set<string>();
  for (const row of data || []) {
    if (excludePostId && row.id === excludePostId) continue;
    const id = photoIdFromUrl(row.featured_image);
    if (id) used.add(id);
  }
  return used;
}

export async function generateArticleForService(
  service: Service,
  settings: AutomationSettings,
  options: { autoPublish?: boolean; topic?: string } = {}
): Promise<{ post: Post; tokensUsed: number; durationMs: number }> {
  const db = getAdminClient();
  const start = Date.now();

  const usedTopics = await getUsedTopics(service.id);
  const { topic, angle } = options.topic
    ? { topic: options.topic, angle: '' }
    : await generateUniqueTopic(service, settings);

  await db.from('generation_logs').insert({
    service_id: service.id,
    status: 'started',
    topic,
    model: settings.ai_model,
  });

  const internalLinks = await getInternalLinkTargets(service.slug);
  const system = buildSystemPrompt(settings);
  const user = buildArticlePrompt({ service, topic, usedTopics, settings, internalLinkTargets: internalLinks });

  let generated: GeneratedArticle;
  let tokensUsed = 0;

  try {
    const result = await generateWithClaude({
      system,
      user,
      model: settings.ai_model,
      temperature: settings.temperature,
      maxTokens: settings.max_tokens,
    });
    tokensUsed = result.tokensUsed;
    generated = parseGeneratedJSON(result.text);
  } catch (err) {
    const durationMs = Date.now() - start;
    await db.from('generation_logs').insert({
      service_id: service.id,
      status: 'failed',
      topic,
      error: String(err),
      duration_ms: durationMs,
      model: settings.ai_model,
    });
    throw err;
  }

  const slug = slugify(generated.title);
  const uniqueSlug = await ensureUniqueSlug(slug);
  const readingTime = calcReadingTime(generated.content);
  const now = new Date().toISOString();
  const shouldPublish = options.autoPublish !== false;
  const seo = sanitizeSeoFields(generated);

  const geoData = {
    ...settings.geo,
    local_keywords: generated.local_keywords || [],
    near_me_keywords: generated.near_me_keywords || [],
  };

  const hero = await fetchUnsplashHeroImage({
    topic: generated.topic || topic,
    title: seo.title,
    category: service.slug,
    focusKeyword: seo.focus_keyword,
    featuredImagePrompt: generated.featured_image_prompt,
    keywords: seo.keywords,
    excludePhotoIds: await getUsedHeroPhotoIds(),
  });

  const postRow = {
    title: seo.title,
    subtitle: seo.subtitle,
    slug: uniqueSlug,
    content: sanitizeArticleMarkdown(generated.content),
    excerpt: seo.excerpt,
    status: shouldPublish ? 'published' : 'draft',
    category: service.slug,
    service_id: service.id,
    featured_image: hero.url,
    featured_prompt: generated.featured_image_prompt,
    seo_title: seo.seo_title,
    meta_title: seo.meta_title,
    meta_description: seo.meta_description,
    canonical: `${settings.site_url}/article/${uniqueSlug}`,
    focus_keyword: seo.focus_keyword,
    keywords: seo.keywords,
    tags: seo.tags,
    faq: generated.faq || [],
    reading_time: readingTime,
    author: settings.author_name,
    published_at: shouldPublish ? now : null,
    updated_at: now,
    created_at: now,
    og_title: seo.og_title,
    og_description: seo.og_description,
    twitter_title: seo.twitter_title,
    twitter_description: seo.twitter_description,
    geo_data: geoData,
    robots: 'index, follow',
    ai_generated: true,
    table_of_contents: generated.table_of_contents || [],
    internal_links: internalLinks.map((l) => ({ text: l.name, href: `/${l.type}/${l.slug}` })),
    external_links: [],
  };

  const { data: inserted, error } = await db.from('posts').insert(postRow).select().single();
  if (error) throw error;

  const post = inserted as Post;
  const schema = buildCombinedSchema(post, settings);

  await db.from('posts').update({ schema }).eq('id', post.id);

  await db.from('seo').insert({
    post_id: post.id,
    image_alt: generated.image_alt,
    image_caption: generated.image_caption,
    image_title: seo.title,
    image_description: seo.excerpt,
    image_filename: imageFilename(uniqueSlug),
    image_webp_filename: webpFilename(uniqueSlug),
    breadcrumb_schema: schema[1],
    article_schema: schema[0],
    faq_schema: schema[2] || {},
    local_keywords: generated.local_keywords || [],
    near_me_keywords: generated.near_me_keywords || [],
  });

  await db.from('prompt_history').insert({
    service_id: service.id,
    topic: generated.topic || topic,
    angle,
    post_id: post.id,
  });

  await db.from('services').update({
    last_generated_at: now,
    updated_at: now,
  }).eq('id', service.id);

  const durationMs = Date.now() - start;

  await db.from('generation_logs').insert({
    post_id: post.id,
    service_id: service.id,
    status: 'success',
    topic: generated.topic || topic,
    tokens_used: tokensUsed,
    duration_ms: durationMs,
    model: settings.ai_model,
  });

  return { post: { ...post, schema }, tokensUsed, durationMs };
}

export async function generateManualArticle(params: {
  topic: string;
  keywords: string[];
  category: string;
  length: string;
  autoPublish?: boolean;
}): Promise<{ post: Post; tokensUsed: number }> {
  const settings = await getAutomationSettings();
  const db = getAdminClient();

  const { data: service } = await db.from('services').select('*').eq('slug', params.category).single();

  const system = buildSystemPrompt(settings);
  const user = buildManualGeneratePrompt(params);

  const { text, tokensUsed } = await generateWithClaude({
    system,
    user,
    model: settings.ai_model,
    temperature: settings.temperature,
    maxTokens: settings.max_tokens,
  });

  const generated = parseGeneratedJSON(text);
  const seo = sanitizeSeoFields({
    ...generated,
    keywords: generated.keywords?.length ? generated.keywords : params.keywords,
  });
  const slug = await ensureUniqueSlug(slugify(seo.title));
  const now = new Date().toISOString();
  const shouldPublish = params.autoPublish === true;

  const hero = await fetchUnsplashHeroImage({
    topic: generated.topic || params.topic,
    title: seo.title,
    category: params.category,
    focusKeyword: seo.focus_keyword,
    featuredImagePrompt: generated.featured_image_prompt,
    keywords: seo.keywords,
    excludePhotoIds: await getUsedHeroPhotoIds(),
  });

  const postRow = {
    title: seo.title,
    subtitle: seo.subtitle,
    slug,
    content: sanitizeArticleMarkdown(generated.content),
    excerpt: seo.excerpt,
    status: shouldPublish ? 'published' : 'draft',
    category: params.category,
    service_id: service?.id || null,
    featured_image: hero.url,
    featured_prompt: generated.featured_image_prompt,
    seo_title: seo.seo_title,
    meta_title: seo.meta_title,
    meta_description: seo.meta_description,
    canonical: `${settings.site_url}/article/${slug}`,
    focus_keyword: seo.focus_keyword,
    keywords: seo.keywords,
    tags: seo.tags,
    faq: generated.faq || [],
    reading_time: calcReadingTime(generated.content),
    author: settings.author_name,
    published_at: shouldPublish ? now : null,
    updated_at: now,
    created_at: now,
    og_title: seo.og_title,
    og_description: seo.og_description,
    twitter_title: seo.twitter_title,
    twitter_description: seo.twitter_description,
    geo_data: settings.geo,
    robots: 'index, follow',
    ai_generated: true,
    table_of_contents: generated.table_of_contents || [],
  };

  const { data: inserted, error } = await db.from('posts').insert(postRow).select().single();
  if (error) throw error;

  const post = inserted as Post;
  const schema = buildCombinedSchema(post, settings);
  await db.from('posts').update({ schema }).eq('id', post.id);

  if (service?.id) {
    await db.from('prompt_history').insert({
      service_id: service.id,
      topic: generated.topic || params.topic,
      post_id: post.id,
    });
  }

  return { post: { ...post, schema }, tokensUsed };
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const db = getAdminClient();
  let slug = base;
  let counter = 1;

  while (true) {
    const { data } = await db.from('posts').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${counter++}`;
  }
}

export async function runDailyAutomation(): Promise<{
  success: boolean;
  postId?: string;
  service?: string;
  error?: string;
}> {
  const db = getAdminClient();
  const settings = await getAutomationSettings();

  if (!settings.enabled) {
    await db.from('cron_logs').insert({
      job_type: 'daily_generate',
      status: 'failed',
      message: 'Automation disabled in settings',
    });
    return { success: false, error: 'Automation disabled' };
  }

  await db.from('cron_logs').insert({
    job_type: 'daily_generate',
    status: 'started',
    message: 'Daily article generation started',
  });

  const service = await getNextService();
  if (!service) {
    await db.from('cron_logs').insert({
      job_type: 'daily_generate',
      status: 'failed',
      message: 'No enabled services found',
    });
    return { success: false, error: 'No enabled services' };
  }

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= settings.retry_count; attempt++) {
    try {
      if (settings.publishing_delay_minutes > 0 && attempt === 1) {
        await new Promise((r) => setTimeout(r, settings.publishing_delay_minutes * 60 * 1000));
      }

      const { post } = await generateArticleForService(service, settings, { autoPublish: true });

      await db.from('cron_logs').insert({
        job_type: 'daily_generate',
        status: 'success',
        message: `Published "${post.title}" for ${service.name}`,
        metadata: { post_id: post.id, service: service.slug, attempt },
      });

      return { success: true, postId: post.id, service: service.slug };
    } catch (err) {
      lastError = String(err);
      await db.from('cron_logs').insert({
        job_type: 'daily_generate',
        status: attempt < settings.retry_count ? 'retry' : 'failed',
        message: `Attempt ${attempt} failed: ${lastError}`,
        metadata: { service: service.slug, attempt },
      });

      if (attempt < settings.retry_count) {
        await new Promise((r) => setTimeout(r, 30000 * attempt));
      }
    }
  }

  return { success: false, error: lastError };
}
