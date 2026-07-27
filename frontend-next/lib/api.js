import axios from 'axios';
import { supabase } from '@/lib/supabase';

/** Internal Next.js API - no external backend required */
export const API = typeof window !== 'undefined'
  ? `${window.location.origin}/api`
  : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/api';

export const api = axios.create({
  baseURL: API,
  timeout: 30000,
});

let cachedToken = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 5 * 60 * 1000;

function needsAuth(url = '') {
  return url.includes('/admin/');
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now - tokenFetchedAt < TOKEN_TTL_MS) return cachedToken;
  const { data: { session } } = await supabase.auth.getSession();
  cachedToken = session?.access_token || null;
  tokenFetchedAt = now;
  return cachedToken;
}

/** Call after login/logout so next admin request gets fresh token */
export function clearApiAuthCache() {
  cachedToken = null;
  tokenFetchedAt = 0;
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined' && needsAuth(config.url || '')) {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};
