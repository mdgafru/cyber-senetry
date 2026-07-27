/**
 * Google deprecated sitemap ping in June 2023.
 * Submit sitemap only via Search Console: Sitemaps → sitemap.xml
 * https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
 */
const SITE = 'https://www.cybersentry360.com';

console.log('Google sitemap ping is deprecated (removed June 2023).');
console.log('Submit your sitemap in Search Console instead:');
console.log(`  Property: ${SITE}/`);
console.log('  Sitemaps → enter: sitemap.xml → Submit');
console.log('After submit, wait 24–48h for "Last read" and discovered pages.');
