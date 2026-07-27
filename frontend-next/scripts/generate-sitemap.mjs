/**
 * Writes lib/seo/sitemap.generated.xml at build time.
 * Served via app/sitemap.xml/route.ts (no Content-Disposition: inline).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PRODUCTION_SITE = 'https://www.cybersentry360.com';
const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

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

async function main() {
  loadEnv();
  const SITE_URL = resolveSiteUrl();
  const today = new Date().toISOString().slice(0, 10);
  let posts = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await db
      .from('posts')
      .select('slug, updated_at, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    posts = data || [];
  }

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  if (xml.includes('localhost') || xml.includes('127.0.0.1')) {
    console.error('Refusing to write sitemap with localhost URLs.');
    process.exit(1);
  }

  const outDir = resolve(root, 'lib/seo');
  const publicOut = resolve(root, 'public', 'sitemap.xml');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'sitemap.generated.xml'), xml, 'utf8');
  writeFileSync(publicOut, xml, 'utf8');
  console.log(`Wrote ${publicOut} (${entries.length} URLs) for ${SITE_URL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
