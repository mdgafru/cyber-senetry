import { NextResponse } from 'next/server';
import { toArticleListDTO, POST_LIST_COLUMNS } from '@/lib/posts';
import { getPublicClient } from '@/lib/supabase/public';

export const revalidate = 120;

export async function GET() {
  const db = getPublicClient();
  const { data } = await db
    .from('posts')
    .select(POST_LIST_COLUMNS)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(6);

  return NextResponse.json(
    { items: (data || []).map(toArticleListDTO) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    }
  );
}
