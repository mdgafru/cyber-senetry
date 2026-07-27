import { NextResponse } from 'next/server';
import { toArticleListDTO, POST_LIST_COLUMNS } from '@/lib/posts';
import { getPublicClient } from '@/lib/supabase/public';

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const db = getPublicClient();
  let query = db
    .from('posts')
    .select(POST_LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);
  if (tag) query = query.contains('tags', [tag]);
  if (q?.trim()) {
    const term = q.trim().replace(/%/g, '');
    query = query.or(
      `title.ilike.%${term}%,subtitle.ilike.%${term}%,excerpt.ilike.%${term}%,focus_keyword.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  const items = (data || []).map(toArticleListDTO);
  return NextResponse.json(
    { items, total: items.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
