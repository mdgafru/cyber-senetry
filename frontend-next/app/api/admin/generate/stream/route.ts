import { NextResponse } from 'next/server';
import { getAutomationSettings } from '@/lib/content/generator';
import { buildSystemPrompt, buildManualGeneratePrompt, buildManualMetadataGeneratePrompt } from '@/lib/content/prompts';
import { buildCombinedSchema, imageFilename, webpFilename } from '@/lib/content/seo';
import { sanitizeSeoFields, validateSeoInput, clampText } from '@/lib/content/meta';
import { sanitizeArticleMarkdown } from '@/lib/content/markdown-inline';
import { streamWithClaude, parseGeneratedJSON } from '@/lib/anthropic';
import { toArticleDTO, slugify, calcReadingTime } from '@/lib/posts';
import { fetchUnsplashHeroImage, photoIdFromUrl } from '@/lib/unsplash';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type ManualMeta = {
  title: string;
  subtitle?: string;
  excerpt?: string;
  focus_keyword?: string;
  seo_title?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  twitter_title?: string;
  twitter_description?: string;
};

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
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

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const {
    mode = 'quick',
    topic,
    keywords = [],
    tags = [],
    category,
    length = 'standard',
    auto_publish = false,
    metadata = {},
  } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ detail: 'Topic required' }, { status: 400 });
  }

  if (mode === 'manual' && !metadata?.title?.trim()) {
    return NextResponse.json({ detail: 'Title required for manual generate' }, { status: 400 });
  }

  if (mode === 'manual') {
    const metaErrors = validateSeoInput({
      title: metadata.title,
      subtitle: metadata.subtitle,
      excerpt: metadata.excerpt,
      focus_keyword: metadata.focus_keyword,
      seo_title: metadata.seo_title,
      meta_title: metadata.meta_title,
      meta_description: metadata.meta_description,
      og_title: metadata.og_title,
      og_description: metadata.og_description,
      twitter_title: metadata.twitter_title,
      twitter_description: metadata.twitter_description,
    });
    if (metaErrors.length) {
      return NextResponse.json({ detail: metaErrors.join('; ') }, { status: 400 });
    }
  }

  const settings = await getAutomationSettings();
  const system = buildSystemPrompt(settings);
  const keywordList = splitList(keywords);
  const tagList = splitList(tags);

  const userPrompt =
    mode === 'manual'
      ? buildManualMetadataGeneratePrompt({
          topic: topic.trim(),
          category,
          length,
          title: clampText(metadata.title, 70),
          subtitle: clampText(metadata.subtitle, 120),
          excerpt: clampText(metadata.excerpt, 160),
          focus_keyword: clampText(metadata.focus_keyword, 60),
          keywords: keywordList,
          tags: tagList,
          seo_title: clampText(metadata.seo_title || metadata.title, 60),
          meta_title: clampText(metadata.meta_title || metadata.seo_title || metadata.title, 60),
          meta_description: clampText(metadata.meta_description, 160),
          og_title: clampText(metadata.og_title, 60),
          og_description: clampText(metadata.og_description, 160),
          twitter_title: clampText(metadata.twitter_title, 60),
          twitter_description: clampText(metadata.twitter_description, 160),
        })
      : buildManualGeneratePrompt({
          topic: topic.trim(),
          keywords: keywordList,
          category,
          length,
        });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        let fullText = '';
        const gen = streamWithClaude({
          system,
          user: userPrompt,
          model: settings.ai_model,
          temperature: settings.temperature,
          maxTokens: settings.max_tokens,
        });

        for await (const chunk of gen) {
          fullText += chunk;
          send({ type: 'delta', content: chunk });
        }

        const generated = parseGeneratedJSON(fullText);
        const db = getAdminClient();
        const now = new Date().toISOString();
        const meta = metadata as ManualMeta;

        const seo = sanitizeSeoFields(
          mode === 'manual'
            ? {
                title: meta.title,
                subtitle: meta.subtitle,
                excerpt: meta.excerpt || generated.excerpt,
                focus_keyword: meta.focus_keyword || keywordList[0] || '',
                seo_title: meta.seo_title,
                meta_title: meta.meta_title,
                meta_description: meta.meta_description || generated.excerpt,
                og_title: meta.og_title,
                og_description: meta.og_description,
                twitter_title: meta.twitter_title,
                twitter_description: meta.twitter_description,
                keywords: keywordList.length ? keywordList : generated.keywords,
                tags: tagList.length ? tagList : generated.tags,
              }
            : {
                title: generated.title,
                subtitle: generated.subtitle,
                excerpt: generated.excerpt,
                focus_keyword: generated.focus_keyword,
                seo_title: generated.seo_title,
                meta_title: generated.meta_title,
                meta_description: generated.meta_description,
                og_title: generated.og_title,
                og_description: generated.og_description,
                twitter_title: generated.twitter_title,
                twitter_description: generated.twitter_description,
                keywords: keywordList.length ? keywordList : generated.keywords,
                tags: tagList.length ? tagList : generated.tags,
              }
        );

        const slug = await ensureUniqueSlug(slugify(seo.title));
        const { data: service } = await db.from('services').select('id').eq('slug', category).maybeSingle();

        const { data: existingImages } = await db.from('posts').select('featured_image');
        const excludePhotoIds = new Set<string>();
        for (const row of existingImages || []) {
          const id = photoIdFromUrl(row.featured_image);
          if (id) excludePhotoIds.add(id);
        }

        const hero = await fetchUnsplashHeroImage({
          topic: topic.trim(),
          title: seo.title,
          category,
          focusKeyword: seo.focus_keyword,
          featuredImagePrompt: generated.featured_image_prompt,
          keywords: seo.keywords,
          excludePhotoIds,
        });

        const row = {
          title: seo.title,
          subtitle: seo.subtitle,
          slug,
          content: sanitizeArticleMarkdown(generated.content),
          excerpt: seo.excerpt,
          status: auto_publish ? 'published' : 'draft',
          category,
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
          published_at: auto_publish ? now : null,
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

        const { data: inserted, error } = await db.from('posts').insert(row).select().single();
        if (error) throw error;

        const schema = buildCombinedSchema(inserted, settings);
        await db.from('posts').update({ schema }).eq('id', inserted.id);

        await db.from('seo').insert({
          post_id: inserted.id,
          image_alt: clampText(generated.image_alt || seo.title, 125),
          image_caption: clampText(generated.image_caption, 200),
          image_title: seo.title,
          image_description: seo.excerpt,
          image_filename: imageFilename(slug),
          image_webp_filename: webpFilename(slug),
          breadcrumb_schema: schema[1],
          article_schema: schema[0],
          faq_schema: schema[2] || {},
          local_keywords: [],
          near_me_keywords: [],
        });

        if (service?.id) {
          await db.from('prompt_history').insert({
            service_id: service.id,
            topic: generated.topic || topic.trim(),
            post_id: inserted.id,
          });
        }

        send({ type: 'article', article: toArticleDTO({ ...inserted, schema }) });
      } catch (err) {
        send({ type: 'error', message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
