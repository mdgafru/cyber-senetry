import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAutomationSettings } from '@/lib/content/generator';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const db = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalPosts },
    { count: published },
    { count: drafts },
    { count: failedJobs },
    { count: todayGenerated },
    { data: recentPosts },
    { data: recentLogs },
  ] = await Promise.all([
    db.from('posts').select('*', { count: 'exact', head: true }),
    db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('generation_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    db.from('posts').select('id, title, category, status, reading_time, created_at').order('created_at', { ascending: false }).limit(8),
    db.from('cron_logs').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  const settings = await getAutomationSettings();

  return NextResponse.json({
    stats: {
      total: totalPosts || 0,
      published: published || 0,
      drafts: drafts || 0,
      todayGenerated: todayGenerated || 0,
      scheduled: 0,
      failedJobs: failedJobs || 0,
      traffic: '-',
    },
    recentPosts: recentPosts || [],
    recentLogs: recentLogs || [],
    automation: settings,
  });
}
