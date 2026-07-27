/**
 * Refresh hero images for all posts using Unsplash API + topic/title search.
 * Ensures no duplicate hero images across articles.
 * Usage: node scripts/refresh-hero-images.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const DESK_IMAGES = {
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85',
  cybersecurity: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=85',
  threats: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
  policy: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=85',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85',
  data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85',
};

const DESK_QUERIES = {
  ai: 'artificial intelligence cybersecurity technology',
  cybersecurity: 'cybersecurity network security data center',
  threats: 'cyber threat hacking security operations',
  policy: 'compliance governance regulation technology',
  cloud: 'cloud computing security infrastructure',
  data: 'data privacy encryption analytics security',
};

function photoIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/photo-([a-zA-Z0-9-]+)/);
  return match?.[1] || null;
}

function buildQuery(post) {
  const category = post.category || 'cybersecurity';
  const desk = DESK_QUERIES[category] || DESK_QUERIES.cybersecurity;
  const raw = [post.focus_keyword, ...(post.keywords || []).slice(0, 2), post.title, post.featured_prompt, desk]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = [...new Set(raw.toLowerCase().split(' '))].filter((w) => w.length > 2);
  return words.slice(0, 10).join(' ') || desk;
}

async function searchPhotos(query, page, key) {
  const params = new URLSearchParams({
    query,
    per_page: '15',
    page: String(page),
    orientation: 'landscape',
    content_filter: 'high',
  });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
  });
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

async function fetchUniqueUnsplash(query, category, usedPhotoIds) {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY missing in .env.local');

  for (let page = 1; page <= 3; page++) {
    const results = await searchPhotos(query, page, key);
    for (const photo of results) {
      const id = photo.id || photoIdFromUrl(photo.urls?.regular);
      if (!id || usedPhotoIds.has(id) || !photo.urls?.regular) continue;
      usedPhotoIds.add(id);
      const url = `${photo.urls.regular.split('?')[0]}?auto=format&fit=crop&w=1600&q=85`;
      return { url, photoId: id };
    }
  }

  return { url: DESK_IMAGES[category] || DESK_IMAGES.cybersecurity, photoId: null };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
  }

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: posts, error } = await db
    .from('posts')
    .select('id, slug, title, category, focus_keyword, featured_prompt, keywords, featured_image')
    .order('created_at', { ascending: false });

  if (error) throw error;
  console.log(`Refreshing ${posts.length} posts (unique images only)…\n`);

  const usedPhotoIds = new Set();
  const assignedUrls = new Map();

  let ok = 0;
  for (const post of posts) {
    const query = buildQuery(post);
    try {
      const { url: imageUrl, photoId } = await fetchUniqueUnsplash(query, post.category, usedPhotoIds);
      await db.from('posts').update({ featured_image: imageUrl, updated_at: new Date().toISOString() }).eq('id', post.id);
      assignedUrls.set(post.slug, imageUrl);
      console.log(`✓ ${post.slug}`);
      console.log(`  query: ${query}`);
      console.log(`  photo: ${photoId || 'fallback'}`);
      console.log(`  url:   ${imageUrl.slice(0, 72)}…\n`);
      ok++;
      await sleep(400);
    } catch (err) {
      console.error(`✗ ${post.slug}: ${err.message}`);
    }
  }

  const urls = [...assignedUrls.values()];
  const unique = new Set(urls);
  console.log(`Done. Updated ${ok}/${posts.length} posts.`);
  console.log(`Unique images: ${unique.size}/${urls.length}${unique.size === urls.length ? ' ✓' : ' (duplicates detected!)'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
