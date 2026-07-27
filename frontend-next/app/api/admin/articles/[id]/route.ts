import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { toArticleDTO, calcReadingTime } from '@/lib/posts';
import { sanitizeSeoFields, validateSeoInput, clampText } from '@/lib/content/meta';
import { sanitizeArticleMarkdown } from '@/lib/content/markdown-inline';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const db = getAdminClient();
  const { data, error } = await db.from('posts').select('*').eq('id', id).single();
  if (error || !data) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    article: {
      ...toArticleDTO(data),
      schema: data.schema,
      faq: data.faq,
      geo_data: data.geo_data,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      canonical: data.canonical,
      og_title: data.og_title,
      og_description: data.og_description,
      table_of_contents: data.table_of_contents,
    },
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const db = getAdminClient();
  const now = new Date().toISOString();

  const errors = validateSeoInput(
    {
      title: body.title,
      subtitle: body.subtitle,
      excerpt: body.excerpt,
      focus_keyword: body.focus_keyword,
      seo_title: body.seo_title,
      meta_title: body.meta_title,
      meta_description: body.seo_description || body.meta_description,
      og_title: body.og_title,
      og_description: body.og_description,
      twitter_title: body.twitter_title,
      twitter_description: body.twitter_description,
    },
    { requireTitle: body.title !== undefined }
  );
  if (errors.length) {
    return NextResponse.json({ detail: errors.join('; ') }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: now };

  if (body.title !== undefined || body.seo_title !== undefined || body.meta_title !== undefined || body.seo_description !== undefined) {
    const seo = sanitizeSeoFields({
      title: body.title,
      subtitle: body.subtitle,
      excerpt: body.excerpt,
      focus_keyword: body.focus_keyword,
      seo_title: body.seo_title,
      meta_title: body.meta_title,
      meta_description: body.seo_description || body.meta_description,
      og_title: body.og_title,
      og_description: body.og_description,
      twitter_title: body.twitter_title,
      twitter_description: body.twitter_description,
      keywords: body.keywords,
      tags: body.tags,
    });
    if (body.title !== undefined) updates.title = seo.title;
    if (body.subtitle !== undefined) updates.subtitle = seo.subtitle;
    if (body.excerpt !== undefined) updates.excerpt = seo.excerpt;
    if (body.focus_keyword !== undefined) updates.focus_keyword = seo.focus_keyword;
    if (body.seo_title !== undefined) updates.seo_title = seo.seo_title;
    if (body.meta_title !== undefined || body.seo_title !== undefined) updates.meta_title = seo.meta_title;
    if (body.seo_description !== undefined || body.meta_description !== undefined) updates.meta_description = seo.meta_description;
    if (body.og_title !== undefined) updates.og_title = seo.og_title;
    if (body.og_description !== undefined) updates.og_description = seo.og_description;
    if (body.twitter_title !== undefined) updates.twitter_title = seo.twitter_title;
    if (body.twitter_description !== undefined) updates.twitter_description = seo.twitter_description;
    if (body.keywords !== undefined) updates.keywords = seo.keywords;
    if (body.tags !== undefined) updates.tags = seo.tags;
  } else {
    if (body.subtitle !== undefined) updates.subtitle = clampText(body.subtitle, 120);
    if (body.excerpt !== undefined) updates.excerpt = clampText(body.excerpt, 160);
    if (body.focus_keyword !== undefined) updates.focus_keyword = clampText(body.focus_keyword, 60);
    if (body.keywords !== undefined) updates.keywords = body.keywords;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.og_title !== undefined) updates.og_title = clampText(body.og_title, 60);
    if (body.og_description !== undefined) updates.og_description = clampText(body.og_description, 160);
    if (body.twitter_title !== undefined) updates.twitter_title = clampText(body.twitter_title, 60);
    if (body.twitter_description !== undefined) updates.twitter_description = clampText(body.twitter_description, 160);
  }

  if (body.body !== undefined) {
    updates.content = sanitizeArticleMarkdown(body.body);
    updates.reading_time = calcReadingTime(String(body.body));
  }
  if (body.category !== undefined) updates.category = body.category;
  if (body.hero_image !== undefined) updates.featured_image = body.hero_image;
  if (body.author !== undefined) updates.author = body.author;
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === 'published') {
      const { data: existing } = await db.from('posts').select('published_at').eq('id', id).single();
      const row = existing as { published_at?: string } | null;
      if (!row?.published_at) updates.published_at = now;
    }
  }

  const { data, error } = await db.from('posts').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  return NextResponse.json(toArticleDTO(data as Parameters<typeof toArticleDTO>[0]));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const db = getAdminClient();
  const { error } = await db.from('posts').delete().eq('id', id);

  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
