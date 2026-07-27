import { NextResponse } from 'next/server';
import { getPublicClient } from '@/lib/supabase/public';

export const revalidate = 300;

export async function GET() {
  const db = getPublicClient();
  const { data: categories } = await db.from('categories').select('*').order('name');
  return NextResponse.json(categories || [], {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
