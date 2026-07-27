/**
 * One-shot article generation using Anthropic + Supabase.
 * Loads .env.local and publishes one structured article for the next service.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

if (!url || !serviceKey) {
  console.error('Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!anthropicKey || anthropicKey.includes('your-key')) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: anthropicKey });

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function calcReadingTime(content) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

const DESK_IMAGES = {
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85',
  cybersecurity: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=85',
  threats: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
  policy: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=85',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85',
  data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85',
};

const DESK_QUERIES = {
  ai: 'artificial intelligence cybersecurity technology',
  cybersecurity: 'cybersecurity network security data center',
  threats: 'cyber threat hacking security operations',
  policy: 'compliance governance regulation technology',
  cloud: 'cloud computing security infrastructure',
  data: 'data privacy encryption analytics security',
};

function buildUnsplashQuery(post, generated) {
  const category = post?.category || generated?.category || 'cybersecurity';
  const desk = DESK_QUERIES[category] || DESK_QUERIES.cybersecurity;
  const raw = [
    generated?.focus_keyword,
    ...(generated?.keywords || []).slice(0, 2),
    generated?.topic,
    generated?.title,
    generated?.featured_image_prompt,
    desk,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = [...new Set(raw.toLowerCase().split(' '))].filter((w) => w.length > 2);
  return words.slice(0, 10).join(' ') || desk;
}

async function fetchUnsplashHero(category, generated) {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  const fallback = DESK_IMAGES[category] || DESK_IMAGES.cybersecurity;
  if (!key) return fallback;

  const query = buildUnsplashQuery({ category }, generated);
  const params = new URLSearchParams({ query, per_page: '1', orientation: 'landscape', content_filter: 'high' });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
  });
  if (!res.ok) {
    console.warn(`Unsplash ${res.status}, using desk fallback`);
    return fallback;
  }
  const data = await res.json();
  const regular = data.results?.[0]?.urls?.regular;
  if (!regular) return fallback;
  console.log(`   Image query: ${query}`);
  return `${regular.split('?')[0]}?auto=format&fit=crop&w=1600&q=85`;
}

function parseJSON(raw) {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in Claude response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function ensureTables() {
  const { error } = await db.from('services').select('id').limit(1);
  if (error) {
    console.error('\n❌ Supabase tables missing or unreachable:', error.message);
    console.error('Run frontend-next/supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor first.\n');
    process.exit(1);
  }
}

async function getNextService() {
  const { data: services, error } = await db
    .from('services')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (error) throw error;
  if (!services?.length) {
    console.error('No enabled services. Seed the services table first.');
    process.exit(1);
  }

  const sorted = [...services].sort((a, b) => {
    if (!a.last_generated_at && !b.last_generated_at) return a.priority - b.priority;
    if (!a.last_generated_at) return -1;
    if (!b.last_generated_at) return 1;
    return new Date(a.last_generated_at) - new Date(b.last_generated_at);
  });

  return sorted[0];
}

async function getServiceBySlug(slug) {
  const { data, error } = await db
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    console.error(`No enabled service with slug "${slug}".`);
    process.exit(1);
  }
  return data;
}

async function getUsedTopics(serviceId) {
  const { data } = await db
    .from('prompt_history')
    .select('topic')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data || []).map((r) => r.topic);
}

async function main() {
  console.log('→ Checking Supabase…');
  await ensureTables();

  const forcedSlug = process.argv[2]?.trim().toLowerCase();
  const service = forcedSlug ? await getServiceBySlug(forcedSlug) : await getNextService();
  console.log(`→ Next service: ${service.name} (${service.slug})`);

  const usedTopics = await getUsedTopics(service.id);
  const avoid = usedTopics.length
    ? `Never repeat these topics:\n${usedTopics.map((t) => `- ${t}`).join('\n')}\n`
    : '';

  console.log('→ Asking Claude for a unique topic…');
  const topicRes = await anthropic.messages.create({
    model,
    max_tokens: 512,
    temperature: 0.9,
    messages: [
      {
        role: 'user',
        content: `${avoid}Generate ONE unique, specific article topic for the "${service.name}" desk at cybersentry360 (AI & cybersecurity publication for CISOs).
Return ONLY JSON: {"topic":"...","angle":"..."}`,
      },
    ],
  });

  const topicText = topicRes.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const { topic, angle } = parseJSON(topicText);
  console.log(`→ Topic: ${topic}`);
  console.log(`→ Angle: ${angle || '(n/a)'}`);

  const { data: otherServices } = await db.from('services').select('name, slug').eq('enabled', true);
  const linkGuide = (otherServices || [])
    .filter((s) => s.slug !== service.slug)
    .map((s) => `- [${s.name}](/category/${s.slug})`)
    .join('\n');

  console.log('→ Generating full article (this takes 1–3 minutes)…');

  const articleRes = await anthropic.messages.create({
    model,
    max_tokens: 16000,
    temperature: 0.85,
    system: `You are a senior editorial writer for cybersentry360. Write human, expert, original cybersecurity/AI journalism.
Rules: 1800–2500 words, E-E-A-T, no AI clichés, no keyword stuffing, conversational but professional.
Return ONLY valid JSON. No markdown fences.`,
    messages: [
      {
        role: 'user',
        content: `Write a complete SEO article for desk "${service.name}".

TOPIC: ${topic}
ANGLE: ${angle || 'practitioner deep dive'}

INTERNAL LINKS (weave 4–6 naturally):
${linkGuide}
- [Search Archive](/search)

Return this exact JSON:
{
  "title": "H1 title 50-70 chars",
  "subtitle": "Editorial dek 80-120 chars",
  "topic": "${topic.replace(/"/g, '\\"')}",
  "content": "Full markdown: # H1, ## Table of Contents, multiple ## H2 / ### H3, lists, comparison table, Benefits, Common Mistakes, Expert Tips, ## FAQs, ## What to Watch, ## Conclusion with CTA. Min 1800 words.",
  "excerpt": "150-160 char excerpt",
  "focus_keyword": "primary keyword",
  "keywords": ["secondary1","secondary2"],
  "tags": ["tag1","tag2"],
  "faq": [{"question":"...","answer":"..."}],
  "table_of_contents": [{"id":"slug","title":"Title","level":2}],
  "featured_image_prompt": "hero image prompt",
  "image_alt": "alt text",
  "image_caption": "caption",
  "seo_title": "≤60 chars",
  "meta_title": "≤60 chars",
  "meta_description": "150-160 chars",
  "og_title": "...",
  "og_description": "...",
  "twitter_title": "...",
  "twitter_description": "...",
  "local_keywords": ["..."],
  "near_me_keywords": ["..."]
}`,
      },
    ],
  });

  const articleText = articleRes.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const generated = parseJSON(articleText);

  if (!generated.title || !generated.content) {
    throw new Error('Generated article missing title or content');
  }

  const wordCount = generated.content.trim().split(/\s+/).length;
  console.log(`→ Words: ${wordCount}`);

  let slug = slugify(generated.title);
  let counter = 1;
  while (true) {
    const { data: existing } = await db.from('posts').select('id').eq('slug', slug).maybeSingle();
    if (!existing) break;
    slug = `${slugify(generated.title)}-${counter++}`;
  }

  const now = new Date().toISOString();
  const readingTime = calcReadingTime(generated.content);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: generated.meta_title || generated.title,
    description: generated.meta_description || generated.excerpt,
    datePublished: now,
    dateModified: now,
    author: { '@type': 'Person', name: 'cybersentry360 Editorial' },
    publisher: { '@type': 'Organization', name: 'cybersentry360' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/article/${slug}` },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: service.name, item: `${siteUrl}/category/${service.slug}` },
      { '@type': 'ListItem', position: 3, name: generated.title, item: `${siteUrl}/article/${slug}` },
    ],
  };

  const faqSchema = generated.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: generated.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }
    : null;

  const schema = [articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])];

  const heroImage = await fetchUnsplashHero(service.slug, generated);

  const postRow = {
    title: generated.title,
    subtitle: generated.subtitle,
    slug,
    content: generated.content,
    excerpt: generated.excerpt,
    status: 'published',
    category: service.slug,
    service_id: service.id,
    featured_image: heroImage,
    featured_prompt: generated.featured_image_prompt,
    seo_title: generated.seo_title,
    meta_title: generated.meta_title,
    meta_description: generated.meta_description,
    canonical: `${siteUrl}/article/${slug}`,
    focus_keyword: generated.focus_keyword,
    keywords: generated.keywords || [],
    tags: generated.tags || [],
    schema,
    faq: generated.faq || [],
    reading_time: readingTime,
    author: 'cybersentry360 Editorial',
    published_at: now,
    updated_at: now,
    created_at: now,
    og_title: generated.og_title,
    og_description: generated.og_description,
    twitter_title: generated.twitter_title,
    twitter_description: generated.twitter_description,
    geo_data: {
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      region: 'US-CA',
      business_area: 'Bay Area & nationwide',
      local_keywords: generated.local_keywords || [],
      near_me_keywords: generated.near_me_keywords || [],
    },
    robots: 'index, follow',
    ai_generated: true,
    table_of_contents: generated.table_of_contents || [],
  };

  console.log('→ Saving to Supabase…');
  const { data: post, error } = await db.from('posts').insert(postRow).select().single();
  if (error) throw error;

  await db.from('seo').insert({
    post_id: post.id,
    image_alt: generated.image_alt,
    image_caption: generated.image_caption,
    image_title: generated.title,
    image_description: generated.excerpt,
    image_filename: `${slug}-featured.jpg`,
    image_webp_filename: `${slug}-featured.webp`,
    breadcrumb_schema: breadcrumbSchema,
    article_schema: articleSchema,
    faq_schema: faqSchema || {},
    local_keywords: generated.local_keywords || [],
    near_me_keywords: generated.near_me_keywords || [],
  });

  await db.from('prompt_history').insert({
    service_id: service.id,
    topic: generated.topic || topic,
    angle: angle || '',
    post_id: post.id,
  });

  await db.from('services').update({ last_generated_at: now, updated_at: now }).eq('id', service.id);

  await db.from('generation_logs').insert({
    post_id: post.id,
    service_id: service.id,
    status: 'success',
    topic: generated.topic || topic,
    tokens_used:
      (topicRes.usage?.input_tokens || 0) +
      (topicRes.usage?.output_tokens || 0) +
      (articleRes.usage?.input_tokens || 0) +
      (articleRes.usage?.output_tokens || 0),
    model,
  });

  await db.from('cron_logs').insert({
    job_type: 'manual_generate',
    status: 'success',
    message: `Published "${post.title}" for ${service.name}`,
    metadata: { post_id: post.id, slug, service: service.slug, words: wordCount },
  });

  console.log('\n✅ Published successfully');
  console.log(`   Title:  ${post.title}`);
  console.log(`   Slug:   ${post.slug}`);
  console.log(`   Desk:   ${service.name}`);
  console.log(`   Words:  ${wordCount}`);
  console.log(`   Read:   ${readingTime} min`);
  console.log(`   URL:    ${siteUrl}/article/${post.slug}`);
  console.log(`   ID:     ${post.id}\n`);
}

main().catch((err) => {
  console.error('\n❌ Generation failed:', err.message || err);
  process.exit(1);
});
