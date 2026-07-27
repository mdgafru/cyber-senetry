import type { Post, ArticleDTO } from './types';
import { normalizeDashes, normalizeDashesMultiline } from './content/meta';

/** Columns for card/list endpoints — never pull full article body */
export const POST_LIST_COLUMNS =
  'id, title, subtitle, slug, category, tags, keywords, featured_image, author, status, seo_title, meta_title, meta_description, excerpt, focus_keyword, reading_time, views, published_at, created_at, updated_at, ai_generated';

/** Map DB post row to legacy frontend API shape */
export function toArticleDTO(post: Post | Record<string, unknown>, { includeBody = true } = {}): ArticleDTO {
  const p = post as Post;
  return {
    id: p.id,
    title: normalizeDashes(p.title),
    subtitle: p.subtitle ? normalizeDashes(p.subtitle) : p.subtitle,
    slug: p.slug,
    body: includeBody ? normalizeDashesMultiline(p.content || '') : '',
    category: p.category || '',
    tags: p.tags || [],
    keywords: p.keywords || [],
    hero_image: p.featured_image,
    author: p.author,
    status: p.status,
    seo_title: normalizeDashes(p.seo_title || p.meta_title),
    meta_title: normalizeDashes(p.meta_title || p.seo_title),
    seo_description: normalizeDashes(p.meta_description),
    excerpt: normalizeDashes(p.excerpt),
    focus_keyword: p.focus_keyword,
    og_title: normalizeDashes(p.og_title),
    og_description: normalizeDashes(p.og_description),
    twitter_title: normalizeDashes(p.twitter_title),
    twitter_description: normalizeDashes(p.twitter_description),
    reading_time: p.reading_time,
    views: p.views,
    published_at: p.published_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
    ai_generated: p.ai_generated,
  };
}

export function toArticleListDTO(post: Post | Record<string, unknown>): ArticleDTO {
  return toArticleDTO(post, { includeBody: false });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function extractExcerpt(content: string, maxLen = 200): string {
  const plain = content.replace(/[#*`>\[\]()]/g, '').replace(/\n+/g, ' ').trim();
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

export function unsplashImage(query: string, width = 1600): string {
  const q = encodeURIComponent(query.slice(0, 80));
  return `https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=${width}&q=85&${q}`;
}

/** Category image fallbacks by desk */
const DESK_IMAGES: Record<string, string> = {
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85',
  cybersecurity: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=85',
  threats: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
  policy: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=85',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85',
  data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85',
};

export function deskHeroImage(category: string): string {
  return DESK_IMAGES[category] || DESK_IMAGES.cybersecurity;
}
