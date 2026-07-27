import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site-url';
import { getPublicClient } from '@/lib/supabase/public';

const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

export const revalidate = 3600;

type PostRow = {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
  tags: string[] | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  let posts: PostRow[] = [];

  try {
    const db = getPublicClient();
    const { data } = await db
      .from('posts')
      .select('slug, updated_at, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    posts = (data as PostRow[] | null) ?? [];
  } catch {
    posts = [];
  }

  const tagMap = new Map<string, string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      const value = String(tag).trim();
      if (!value) continue;
      const key = value.toLowerCase();
      const existing = tagMap.get(key);
      const isLower = value === key;
      if (!existing || (isLower && existing !== key)) {
        tagMap.set(key, value);
      }
    }
  }

  const latest = posts[0]
    ? new Date(posts[0].updated_at || posts[0].published_at || Date.now())
    : new Date();

  return [
    { url: baseUrl, lastModified: latest, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    ...DESK_SLUGS.map((slug) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/article/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...[...tagMap.values()].slice(0, 120).map((tag) => ({
      url: `${baseUrl}/tag/${encodeURIComponent(tag)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];
}
