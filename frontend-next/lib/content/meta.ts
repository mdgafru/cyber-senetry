/**
 * SEO meta standards (Google SERP / social cards).
 * All generate + save paths must run output through sanitizeSeoFields.
 */

export const SEO_LIMITS = {
  title: { min: 30, max: 70, ideal: 60 },
  seo_title: { min: 30, max: 60, ideal: 55 },
  meta_title: { min: 30, max: 60, ideal: 55 },
  meta_description: { min: 120, max: 160, ideal: 155 },
  excerpt: { min: 120, max: 160, ideal: 155 },
  og_title: { min: 30, max: 60, ideal: 55 },
  og_description: { min: 120, max: 160, ideal: 155 },
  twitter_title: { min: 30, max: 60, ideal: 55 },
  twitter_description: { min: 120, max: 160, ideal: 155 },
  subtitle: { min: 40, max: 120, ideal: 100 },
  focus_keyword: { min: 2, max: 60, ideal: 40 },
} as const;

type LimitKey = keyof typeof SEO_LIMITS;

/** Replace long em/en dashes with ASCII hyphen (single line). */
export function normalizeDashes(value: unknown): string {
  if (value == null) return '';
  return String(value).replace(/\s*[\u2014\u2013]\s*/g, ' - ');
}

/** Replace dashes in markdown/multiline text without destroying line breaks. */
export function normalizeDashesMultiline(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .split(/\r?\n/)
    .map((line) => normalizeDashes(line).replace(/[^\S]+/g, ' ').trim())
    .join('\n');
}

/** Trim and cut at word boundary when possible (never exceed max). */
export function clampText(value: unknown, max: number, min = 0): string {
  if (value == null) return '';
  let text = normalizeDashes(String(value).replace(/[^\S\r\n]+/g, ' ').trim());
  if (!text) return '';

  if (text.length > max) {
    const slice = text.slice(0, max);
    const lastSpace = slice.lastIndexOf(' ');
    text = (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
    text = text.replace(/[,:;.\-–—]+$/, '').trim();
  }

  if (min > 0 && text.length > 0 && text.length < min) {
    // Keep short verified text — do not invent filler to pad
    return text;
  }

  return text;
}

function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s) return s;
  }
  return '';
}

export type SeoInput = {
  title?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  focus_keyword?: string | null;
  seo_title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  keywords?: string[] | null;
  tags?: string[] | null;
};

export type SanitizedSeo = {
  title: string;
  subtitle: string;
  excerpt: string;
  focus_keyword: string;
  seo_title: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  twitter_title: string;
  twitter_description: string;
  keywords: string[];
  tags: string[];
};

function cleanList(list: unknown, maxItems = 8, maxItemLen = 40): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const s = clampText(item, maxItemLen);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

/**
 * Only keep verified / length-safe SEO fields.
 * Prefers explicit values; falls back to title / description; never invents content.
 */
export function sanitizeSeoFields(input: SeoInput): SanitizedSeo {
  const title = clampText(input.title, SEO_LIMITS.title.max) || 'Untitled';

  const seo_title = clampText(
    firstNonEmpty(input.seo_title, input.meta_title, title),
    SEO_LIMITS.seo_title.max
  );
  const meta_title = clampText(
    firstNonEmpty(input.meta_title, input.seo_title, title),
    SEO_LIMITS.meta_title.max
  );

  const meta_description = clampText(
    firstNonEmpty(input.meta_description, input.excerpt, input.og_description),
    SEO_LIMITS.meta_description.max
  );
  const excerpt = clampText(
    firstNonEmpty(input.excerpt, input.meta_description, meta_description),
    SEO_LIMITS.excerpt.max
  );

  const og_title = clampText(
    firstNonEmpty(input.og_title, seo_title, title),
    SEO_LIMITS.og_title.max
  );
  const og_description = clampText(
    firstNonEmpty(input.og_description, meta_description, excerpt),
    SEO_LIMITS.og_description.max
  );
  const twitter_title = clampText(
    firstNonEmpty(input.twitter_title, og_title, seo_title, title),
    SEO_LIMITS.twitter_title.max
  );
  const twitter_description = clampText(
    firstNonEmpty(input.twitter_description, og_description, meta_description, excerpt),
    SEO_LIMITS.twitter_description.max
  );

  return {
    title,
    subtitle: clampText(input.subtitle, SEO_LIMITS.subtitle.max),
    excerpt,
    focus_keyword: clampText(input.focus_keyword, SEO_LIMITS.focus_keyword.max),
    seo_title,
    meta_title,
    meta_description,
    og_title,
    og_description,
    twitter_title,
    twitter_description,
    keywords: cleanList(input.keywords),
    tags: cleanList(input.tags, 6, 30),
  };
}

/** Validate lengths for manual form — returns error messages. */
export function validateSeoInput(input: SeoInput, { requireTitle = true } = {}): string[] {
  const errors: string[] = [];
  const title = (input.title || '').trim();

  if (requireTitle && !title) errors.push('Title is required');
  if (title && title.length > SEO_LIMITS.title.max) {
    errors.push(`Title must be ≤${SEO_LIMITS.title.max} characters (now ${title.length})`);
  }

  const check = (label: string, value: string | null | undefined, key: LimitKey) => {
    const v = (value || '').trim();
    if (!v) return;
    if (v.length > SEO_LIMITS[key].max) {
      errors.push(`${label} must be ≤${SEO_LIMITS[key].max} characters (now ${v.length})`);
    }
  };

  check('SEO title', input.seo_title, 'seo_title');
  check('Meta title', input.meta_title, 'meta_title');
  check('Meta description', input.meta_description, 'meta_description');
  check('Excerpt', input.excerpt, 'excerpt');
  check('OG title', input.og_title, 'og_title');
  check('OG description', input.og_description, 'og_description');
  check('Twitter title', input.twitter_title, 'twitter_title');
  check('Twitter description', input.twitter_description, 'twitter_description');
  check('Subtitle', input.subtitle, 'subtitle');

  return errors;
}

/** Soft warnings (too short) — still allow save after clamp. */
export function seoLengthWarnings(fields: SanitizedSeo): string[] {
  const warnings: string[] = [];
  const warn = (label: string, value: string, key: LimitKey) => {
    if (!value) return;
    const { min, max } = SEO_LIMITS[key];
    if (value.length < min) warnings.push(`${label} is short (${value.length}/${min}–${max})`);
  };
  warn('SEO title', fields.seo_title, 'seo_title');
  warn('Meta description', fields.meta_description, 'meta_description');
  return warnings;
}
