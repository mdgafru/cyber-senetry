import { NextResponse } from 'next/server';
import { getPublicClient } from '@/lib/supabase/public';

export const revalidate = 300;

export async function GET() {
  const db = getPublicClient();
  const { data: posts } = await db
    .from('posts')
    .select('tags')
    .eq('status', 'published');

  const counts: Record<string, number> = {};
  for (const p of posts || []) {
    for (const tag of p.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  const topics = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json(
    { topics },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
