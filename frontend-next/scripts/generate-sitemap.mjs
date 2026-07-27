/**
 * Build-time sitemap → public/sitemap.xml (CDN static file, no serverless on fetch).
 * Requires NEXT_PUBLIC_SUPABASE_* on Vercel; keeps existing file if env/DB unavailable.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PRODUCTION_SITE = 'https://www.cybersentry360.com';
const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];
const publicOut = resolve(root, 'public', 'sitemap.xml');

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (process.env.VERCEL === '1') {
    if (!raw || raw.includes('localhost') || raw.includes('127.0.0.1') || raw.includes('your-domain')) {
      return PRODUCTION_SITE;
    }
  }
  if (raw && !raw.includes('localhost') && !raw.includes('127.0.0.1')) {
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    return url.replace(/\/+$/, '');
  }
  return PRODUCTION_SITE;
}

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(root, name), 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      // optional
    }
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toLastMod(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function buildXml(SITE_URL, posts) {
  const today = new Date().toISOString().slice(0, 10);
  const tagSet = new Set();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const t = String(tag).trim();
      if (t) tagSet.add(t);
    }
  }

  const entries = [
    urlEntry(SITE_URL, posts[0] ? toLastMod(posts[0].updated_at || posts[0].published_at) : today, 'daily', '1.0'),
    urlEntry(`${SITE_URL}/search`, today, 'weekly', '0.5'),
    ...DESK_SLUGS.map((slug) => urlEntry(`${SITE_URL}/category/${slug}`, today, 'daily', '0.85')),
    ...posts.map((post) =>
      urlEntry(
        `${SITE_URL}/article/${post.slug}`,
        toLastMod(post.updated_at || post.published_at),
        'weekly',
        '0.9'
      )
    ),
    ...[...tagSet].slice(0, 120).map((tag) =>
      urlEntry(`${SITE_URL}/tag/${encodeURIComponent(tag)}`, today, 'weekly', '0.4')
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

async function main() {
  loadEnv();
  const SITE_URL = resolveSiteUrl();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (existsSync(publicOut)) {
      console.warn('Supabase env missing — keeping existing public/sitemap.xml');
      return;
    }
    const fallback = buildXml(SITE_URL, []);
    writeFileSync(publicOut, fallback, 'utf8');
    console.warn('Supabase env missing — wrote minimal sitemap (static pages only)');
    return;
  }

  let posts = [];
  try {
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await db
      .from('posts')
      .select('slug, updated_at, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    posts = data || [];
  } catch (err) {
    if (existsSync(publicOut)) {
      console.warn('Supabase fetch failed — keeping existing public/sitemap.xml:', err.message || err);
      return;
    }
    console.warn('Supabase fetch failed — writing minimal sitemap:', err.message || err);
    posts = [];
  }

  const xml = buildXml(SITE_URL, posts);
  if (xml.includes('localhost') || xml.includes('127.0.0.1')) {
    console.error('Refusing to write sitemap with localhost URLs.');
    process.exit(1);
  }

  writeFileSync(publicOut, xml, 'utf8');
  const count = (xml.match(/<url>/g) || []).length;
  console.log(`Wrote ${publicOut} (${count} URLs) for ${SITE_URL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
