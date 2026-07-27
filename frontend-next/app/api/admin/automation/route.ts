import { NextResponse } from 'next/server';
import { getAutomationSettings, updateAutomationSettings, runDailyAutomation, getNextService } from '@/lib/content/generator';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const settings = await getAutomationSettings();
  const nextService = await getNextService();
  return NextResponse.json({ settings, nextService });
}

export async function PUT(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const settings = await updateAutomationSettings(body);
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { action } = await request.json();

  if (action === 'run_now') {
    const result = await runDailyAutomation();
    return NextResponse.json(result);
  }

  return NextResponse.json({ detail: 'Unknown action' }, { status: 400 });
}
