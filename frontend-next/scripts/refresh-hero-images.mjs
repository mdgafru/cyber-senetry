/**
 * Refresh hero images for all posts using Unsplash API + topic/title search.
 * Ensures no duplicate hero images across articles (API id + CDN photo- id).
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

const DESK_FALLBACK_POOL = {
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1600&q=85',
  ],
  cybersecurity: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1510511459019-5dda7724ecb8?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=1600&q=85',
  ],
  threats: [
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a2?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1600&q=85',
  ],
  policy: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=1600&q=85',
  ],
  cloud: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a2?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1600&q=85',
  ],
  data: [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=85',
  ],
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

function photoKeys({ id, url }) {
  const keys = new Set();
  if (id) keys.add(id);
  const cdn = photoIdFromUrl(url);
  if (cdn) keys.add(cdn);
  return [...keys];
}

function isExcluded(keys, used) {
  return keys.some((k) => used.has(k));
}

function markUsed(keys, used) {
  for (const k of keys) used.add(k);
}

function buildQuery(post, variant = 0) {
  const category = post.category || 'cybersecurity';
  const desk = DESK_QUERIES[category] || DESK_QUERIES.cybersecurity;
  const raw = [post.focus_keyword, ...(post.keywords || []).slice(0, 2), post.title, post.featured_prompt, desk]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = [...new Set(raw.toLowerCase().split(' '))].filter((w) => w.length > 2);
  let query = words.slice(0, 10).join(' ') || desk;
  if (variant === 1) query = `${desk} ${post.focus_keyword || words[0] || ''}`.trim();
  if (variant === 2) query = `${category} security technology workstation`.trim();
  if (variant >= 3) query = `${desk} abstract digital`.trim();
  return query;
}

async function searchPhotos(query, page, key) {
  const params = new URLSearchParams({
    query,
    per_page: '20',
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

function pickDeskFallback(category, usedPhotoIds) {
  const pool = [
    ...(DESK_FALLBACK_POOL[category] || []),
    ...Object.values(DESK_FALLBACK_POOL).flat(),
  ];
  for (const url of pool) {
    const keys = photoKeys({ url });
    if (isExcluded(keys, usedPhotoIds)) continue;
    markUsed(keys, usedPhotoIds);
    return { url, photoId: photoIdFromUrl(url) };
  }
  const fallback = (DESK_FALLBACK_POOL[category] || DESK_FALLBACK_POOL.cybersecurity)[0];
  return { url: fallback, photoId: photoIdFromUrl(fallback) };
}

async function fetchUniqueUnsplash(post, usedPhotoIds) {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY missing in .env.local');

  for (let variant = 0; variant < 4; variant++) {
    const query = buildQuery(post, variant);
    for (let page = 1; page <= 5; page++) {
      const results = await searchPhotos(query, page, key);
      for (const photo of results) {
        if (!photo.urls?.regular) continue;
        const keys = photoKeys({ id: photo.id, url: photo.urls.regular });
        if (!keys.length || isExcluded(keys, usedPhotoIds)) continue;
        markUsed(keys, usedPhotoIds);
        const url = `${photo.urls.regular.split('?')[0]}?auto=format&fit=crop&w=1600&q=85`;
        return { url, photoId: photoIdFromUrl(url) || photo.id, query, source: 'unsplash' };
      }
    }
  }

  const fallback = pickDeskFallback(post.category || 'cybersecurity', usedPhotoIds);
  return { ...fallback, query: buildQuery(post), source: 'fallback' };
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
    try {
      const { url: imageUrl, photoId, query, source } = await fetchUniqueUnsplash(post, usedPhotoIds);
      await db.from('posts').update({ featured_image: imageUrl, updated_at: new Date().toISOString() }).eq('id', post.id);
      assignedUrls.set(post.slug, imageUrl.split('?')[0]);
      console.log(`✓ ${post.slug}`);
      console.log(`  query: ${query}`);
      console.log(`  source: ${source}`);
      console.log(`  photo: ${photoId || 'fallback'}`);
      console.log(`  url:   ${imageUrl.slice(0, 72)}…\n`);
      ok++;
      await sleep(450);
    } catch (err) {
      console.error(`✗ ${post.slug}: ${err.message}`);
    }
  }

  const urls = [...assignedUrls.values()];
  const unique = new Set(urls);
  console.log(`Done. Updated ${ok}/${posts.length} posts.`);
  console.log(`Unique images: ${unique.size}/${urls.length}${unique.size === urls.length ? ' ✓' : ' (duplicates detected!)'}`);

  if (unique.size !== urls.length) {
    const counts = new Map();
    for (const u of urls) counts.set(u, (counts.get(u) || 0) + 1);
    for (const [u, n] of counts) {
      if (n > 1) console.log(`  DUPLICATE x${n}: ${u}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
