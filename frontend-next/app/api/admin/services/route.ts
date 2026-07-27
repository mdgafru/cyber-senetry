import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const db = getAdminClient();
  const { data } = await db.from('services').select('*').order('priority');
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const db = getAdminClient();
  const { data, error } = await db.from('services').insert({
    name: body.name,
    slug: body.slug,
    description: body.description,
    enabled: body.enabled ?? true,
    priority: body.priority ?? 99,
  }).select().single();
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const db = getAdminClient();
  const { data, error } = await db.from('services').update({
    name: body.name,
    slug: body.slug,
    description: body.description,
    enabled: body.enabled,
    priority: body.priority,
    updated_at: new Date().toISOString(),
  }).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { id } = await request.json();
  const db = getAdminClient();
  await db.from('services').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
