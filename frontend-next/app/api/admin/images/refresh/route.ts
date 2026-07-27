import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { fetchUnsplashHeroImage, getUnsplashAccessKey, photoIdFromUrl, sleep } from '@/lib/unsplash';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type PostRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  focus_keyword: string | null;
  featured_prompt: string | null;
  keywords: string[] | null;
};

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  if (!getUnsplashAccessKey()) {
    return NextResponse.json(
      { detail: 'UNSPLASH_ACCESS_KEY is not configured. Add it to .env.local and Vercel.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const postId = body.postId as string | undefined;
  const refreshAll = body.all === true;

  if (!postId && !refreshAll) {
    return NextResponse.json({ detail: 'Send { postId } or { all: true }' }, { status: 400 });
  }

  const db = getAdminClient();
  let query = db
    .from('posts')
    .select('id, slug, title, category, focus_keyword, featured_prompt, keywords')
    .order('created_at', { ascending: false });

  if (postId) query = query.eq('id', postId);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });
  if (!posts?.length) return NextResponse.json({ detail: 'No posts found' }, { status: 404 });

  const items: Array<{
    id: string;
    slug: string;
    url: string;
    source: string;
    query: string;
  }> = [];

  const usedPhotoIds = new Set<string>();
  const { data: existingRows } = await db.from('posts').select('id, featured_image');
  for (const row of existingRows || []) {
    if (postId && row.id === postId) continue;
    const id = photoIdFromUrl(row.featured_image);
    if (id) usedPhotoIds.add(id);
  }

  for (const post of posts as PostRow[]) {
    const hero = await fetchUnsplashHeroImage({
      title: post.title,
      category: post.category,
      focusKeyword: post.focus_keyword,
      featuredImagePrompt: post.featured_prompt,
      keywords: post.keywords,
      excludePhotoIds: usedPhotoIds,
    });

    const now = new Date().toISOString();
    const { error: updateErr } = await db
      .from('posts')
      .update({ featured_image: hero.url, updated_at: now })
      .eq('id', post.id);

    if (updateErr) {
      return NextResponse.json({ detail: updateErr.message }, { status: 500 });
    }

    items.push({
      id: post.id,
      slug: post.slug,
      url: hero.url,
      source: hero.source,
      query: hero.query,
    });

    if (posts.length > 1) await sleep(400);
  }

  return NextResponse.json({
    updated: items.length,
    unsplash: items.filter((i) => i.source === 'unsplash').length,
    items,
  });
}
