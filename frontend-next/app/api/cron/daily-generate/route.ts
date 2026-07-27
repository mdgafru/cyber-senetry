import { NextResponse } from 'next/server';
import { runDailyAutomation } from '@/lib/content/generator';
import { verifyCronSecret } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runDailyAutomation();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
