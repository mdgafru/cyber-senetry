import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';

export async function requireApiAuth(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, response: NextResponse.json({ detail: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, response: null };
}
