import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { toArticleDTO, slugify, calcReadingTime } from '@/lib/posts';
import { sanitizeSeoFields, validateSeoInput } from '@/lib/content/meta';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 500);

  const db = getAdminClient();
  let query = db.from('posts').select('*').order('updated_at', { ascending: false }).limit(limit);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  return NextResponse.json({ items: (data || []).map(toArticleDTO) });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const errors = validateSeoInput({
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
  });
  if (errors.length) {
    return NextResponse.json({ detail: errors.join('; ') }, { status: 400 });
  }

  const seo = sanitizeSeoFields({
    title: body.title,
    subtitle: body.subtitle,
    excerpt: body.excerpt || (body.body || '').slice(0, 160),
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

  const db = getAdminClient();
  const now = new Date().toISOString();
  const slug = slugify(seo.title || 'untitled');

  const row = {
    title: seo.title,
    subtitle: seo.subtitle,
    slug,
    content: body.body || body.content || '',
    excerpt: seo.excerpt,
    status: body.status || 'draft',
    category: body.category,
    tags: seo.tags,
    keywords: seo.keywords,
    featured_image: body.hero_image || body.featured_image || '',
    author: body.author || 'cybersentry360 Editorial',
    seo_title: seo.seo_title,
    meta_title: seo.meta_title,
    meta_description: seo.meta_description,
    focus_keyword: seo.focus_keyword,
    og_title: seo.og_title,
    og_description: seo.og_description,
    twitter_title: seo.twitter_title,
    twitter_description: seo.twitter_description,
    reading_time: calcReadingTime(body.body || ''),
    published_at: body.status === 'published' ? now : null,
    updated_at: now,
    created_at: now,
    ai_generated: false,
  };

  const { data, error } = await db.from('posts').insert(row).select().single();
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  return NextResponse.json(toArticleDTO(data));
}
