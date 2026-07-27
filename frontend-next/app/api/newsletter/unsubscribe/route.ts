import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const e = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ detail: 'Valid email required' }, { status: 400 });
    }

    const db = getAdminClient();
    const now = new Date().toISOString();

    const { data: existing } = await db
      .from('newsletter_subscribers')
      .select('email, status')
      .eq('email', email)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ detail: 'Email not found in subscribers' }, { status: 404 });
    }

    if (existing.status === 'unsubscribed') {
      return NextResponse.json({ ok: true, subscribed: false, message: 'Already unsubscribed' });
    }

    const { error } = await db
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: now })
      .eq('email', email);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscribed: false });
  } catch (err) {
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
