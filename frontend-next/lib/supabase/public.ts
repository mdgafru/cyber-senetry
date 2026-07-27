import { createClient } from '@supabase/supabase-js';

let publicClient: ReturnType<typeof createClient> | null = null;

export function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local');
  }

  if (!publicClient) {
    publicClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return publicClient;
}
