/**
 * Notify Google to re-fetch sitemap after deploy.
 * Usage: node scripts/ping-google-sitemap.mjs
 */
const SITE = 'https://www.cybersentry360.com';
const sitemapUrl = `${SITE}/sitemap.xml`;
const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

const res = await fetch(pingUrl);
console.log(`Ping ${pingUrl}`);
console.log(`Response: ${res.status} ${res.statusText}`);
