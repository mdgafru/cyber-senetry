import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { requireApiAuth } from '@/lib/api-auth';

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { source: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'cybersecurity' },
  { source: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'threats' },
  { source: 'Anthropic', url: 'https://www.anthropic.com/feed.xml', category: 'ai' },
  { source: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'cybersecurity' },
  { source: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'threats' },
  { source: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/security', category: 'cybersecurity' },
  { source: 'Schneier on Security', url: 'https://www.schneier.com/feed/atom/', category: 'policy' },
  { source: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'ai' },
];

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const items: {
    source: string;
    title: string;
    link: string;
    summary: string;
    published: string;
    category: string;
  }[] = [];

  await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of (parsed.items || []).slice(0, 5)) {
          items.push({
            source: feed.source,
            title: item.title || '',
            link: item.link || '',
            summary: (item.contentSnippet || item.summary || '').slice(0, 300),
            published: item.isoDate || item.pubDate || '',
            category: feed.category,
          });
        }
      } catch {
        // skip failed feeds
      }
    })
  );

  items.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  return NextResponse.json({ items: items.slice(0, 40) });
}
