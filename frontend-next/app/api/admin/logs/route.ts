import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'cron';
  const db = getAdminClient();

  if (type === 'generation') {
    const { data } = await db.from('generation_logs').select('*').order('created_at', { ascending: false }).limit(50);
    return NextResponse.json({ items: data || [] });
  }

  const { data } = await db.from('cron_logs').select('*').order('created_at', { ascending: false }).limit(50);
  return NextResponse.json({ items: data || [] });
}
