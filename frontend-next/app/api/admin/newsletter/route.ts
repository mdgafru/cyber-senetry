import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const db = getAdminClient();
  const { data } = await db
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  return NextResponse.json({
    items: data || [],
    total: data?.length || 0,
  });
}

/** Delete subscriber by id or email */
export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  let id = searchParams.get('id');
  let email = searchParams.get('email');

  if (!id && !email) {
    try {
      const body = await request.json();
      id = body.id || null;
      email = body.email || null;
    } catch {
      /* no body */
    }
  }

  if (!id && !email) {
    return NextResponse.json({ detail: 'id or email required' }, { status: 400 });
  }

  const db = getAdminClient();
  let query = db.from('newsletter_subscribers').delete();
  if (id) query = query.eq('id', id);
  else query = query.eq('email', email.toLowerCase().trim());

  const { error } = await query;
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
