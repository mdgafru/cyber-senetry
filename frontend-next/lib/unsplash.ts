import { deskHeroImage } from './posts';

const DESK_QUERIES: Record<string, string> = {
  ai: 'artificial intelligence cybersecurity technology',
  cybersecurity: 'cybersecurity network security data center',
  threats: 'cyber threat hacking security operations',
  policy: 'compliance governance regulation technology',
  cloud: 'cloud computing security infrastructure',
  data: 'data privacy encryption analytics security',
};

/** Extra desk fallbacks so articles never share the same stock image. */
const DESK_FALLBACK_POOL: Record<string, string[]> = {
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

export type HeroImageInput = {
  topic?: string | null;
  title?: string | null;
  category?: string | null;
  focusKeyword?: string | null;
  featuredImagePrompt?: string | null;
  keywords?: string[] | null;
  /** Skip photos already assigned to other articles (API id and/or CDN photo- id). */
  excludePhotoIds?: Set<string>;
};

export type HeroImageResult = {
  url: string;
  source: 'unsplash' | 'fallback';
  query: string;
  photoId?: string;
  photographer?: string;
};

type UnsplashPhoto = {
  id?: string;
  urls?: { regular?: string };
  user?: { name?: string };
  alt_description?: string | null;
  description?: string | null;
  tags?: Array<{ title?: string }>;
};

export function getUnsplashAccessKey(): string | null {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  return key || null;
}

/** Extract Unsplash CDN photo id from url (photo-{id} segment). */
export function photoIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/photo-([a-zA-Z0-9-]+)/);
  return match?.[1] || null;
}

export function toHeroUrl(regular: string): string {
  return `${regular.split('?')[0]}?auto=format&fit=crop&w=1600&q=85`;
}

/** All identity keys for a photo so exclude sets never miss a match. */
export function photoIdentityKeys(photo: {
  id?: string | null;
  url?: string | null;
}): string[] {
  const keys = new Set<string>();
  if (photo.id) keys.add(photo.id);
  const cdnId = photoIdFromUrl(photo.url || undefined);
  if (cdnId) keys.add(cdnId);
  return [...keys];
}

function isExcluded(keys: string[], excludePhotoIds: Set<string>): boolean {
  return keys.some((k) => excludePhotoIds.has(k));
}

function markUsed(keys: string[], excludePhotoIds: Set<string>) {
  for (const k of keys) excludePhotoIds.add(k);
}

/** Map cyber jargon → photographable Unsplash scenes. */
const VISUAL_CONCEPTS: Array<{ match: RegExp; visuals: string }> = [
  { match: /complian|policy|regulat|gdpr|nist|iso|disclosure|legal|governance|eu.?ai.?act|privacy.?law|delete.?act/i, visuals: 'legal documents desk business meeting compliance' },
  { match: /encrypt|key.?manage|cryptograph|token|hmac|certificate/i, visuals: 'digital padlock laptop cybersecurity desk' },
  { match: /cloud|aws|azure|gcp|kubernetes|serverless|container|multi.?cloud|cspm|spot.?instance|ephemeral/i, visuals: 'data center server racks cloud computing' },
  { match: /breach|hack|threat|malware|ransom|exfiltrat|lateral.?movement|attack|soc\b|siem|detection/i, visuals: 'security operations center monitors cyber analyst' },
  { match: /api|developer|code|devops|rasp|waf|application.?secur/i, visuals: 'software developer coding laptop terminal screen' },
  { match: /identity|zero.?trust|itdr|access.?control|badge|shadow.?ai|shadow.?it/i, visuals: 'identity access security badge office technology' },
  { match: /data.?residen|privacy|pii|broker|synthetic.?data|dataset|embedding/i, visuals: 'data privacy protection analytics dashboard' },
  { match: /board|ciso|executive|strategy|risk.?manage/i, visuals: 'executive business meeting modern office' },
  { match: /network|firewall|vpn|router|packet/i, visuals: 'network cables server room infrastructure' },
  { match: /prompt.?inject|jailbreak|adversarial|llm|language model|rag\b|inference|model.?theft|model.?extract|neural|artificial intelligence|security ai|ai model|ai training/i, visuals: 'artificial intelligence neural network computer laboratory' },
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'why', 'how', 'when', 'who',
  'are', 'was', 'were', 'been', 'will', 'can', 'cant', 'dont', 'into', 'over', 'under',
  'your', 'our', 'their', 'vs', 'via', 'new', 'one', 'two', 'year', 'years', 'still',
  'need', 'know', 'now', 'get', 'getting', 'making', 'switch', 'reality', 'problem',
  'hidden', 'unseen', 'inside', 'across', 'through', 'using', 'based', 'detailed',
  'prompt', 'editorial', 'hero', 'image', 'photo', 'cinematic', 'dramatic', 'wide',
  'angle', 'visualization', 'abstract', 'sophisticated', 'professional',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function visualSceneForText(text: string, category: string): string {
  for (const rule of VISUAL_CONCEPTS) {
    if (rule.match.test(text)) return rule.visuals;
  }
  return DESK_QUERIES[category] || DESK_QUERIES.cybersecurity;
}

/**
 * Build Unsplash search queries that favor photographable scenes
 * matching the article topic (not abstract SEO jargon).
 */
export function buildUnsplashQuery(input: HeroImageInput, variant = 0): string {
  const category = (input.category || 'cybersecurity').toLowerCase();
  const contentBlob = [input.title, input.topic, input.focusKeyword, ...(input.keywords || [])]
    .filter(Boolean)
    .join(' ');

  const scene = visualSceneForText(contentBlob, category);
  const promptTokens = tokenize(input.featuredImagePrompt || '').slice(0, 6);
  const focusTokens = tokenize(input.focusKeyword || '').slice(0, 3);
  const titleTokens = tokenize(input.title || '').slice(0, 4);

  // Prefer Claude's Unsplash-style keywords when present and concrete.
  const promptLooksVisual =
    promptTokens.length >= 3 &&
    !/adversarial|jailbreak|governance|compliance stacks|visualization/i.test(
      input.featuredImagePrompt || ''
    );

  if (variant === 0 && promptLooksVisual) {
    return [...new Set([...promptTokens, ...scene.split(' ').slice(0, 3)])].slice(0, 8).join(' ');
  }

  if (variant === 0) {
    return [...new Set([...focusTokens, ...titleTokens.slice(0, 2), ...scene.split(' ')])]
      .slice(0, 8)
      .join(' ');
  }
  if (variant === 1) {
    return `${scene} ${focusTokens.join(' ')}`.trim();
  }
  if (variant === 2) {
    return `${scene} technology workplace`.trim();
  }
  return `${DESK_QUERIES[category] || DESK_QUERIES.cybersecurity} modern office`.trim();
}

export function relevanceTerms(input: HeroImageInput): string[] {
  return [
    ...tokenize(input.focusKeyword || ''),
    ...tokenize(input.title || '').slice(0, 6),
    ...tokenize(input.topic || '').slice(0, 4),
    ...tokenize((input.keywords || []).join(' ')).slice(0, 4),
    ...tokenize(input.featuredImagePrompt || '').slice(0, 6),
  ];
}

function scorePhoto(photo: UnsplashPhoto, terms: string[]): number {
  const tagText = (photo.tags || []).map((t) => t.title || '').join(' ');
  const hay = `${photo.alt_description || ''} ${photo.description || ''} ${tagText}`.toLowerCase();
  if (!hay.trim()) return 0;
  let score = 0;
  for (const term of terms) {
    if (term.length < 3) continue;
    if (hay.includes(term)) score += 3;
  }
  if (photo.alt_description) score += 1;
  return score;
}

async function searchUnsplashPhotos(
  query: string,
  key: string,
  page: number,
  perPage = 20
): Promise<UnsplashPhoto[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    page: String(page),
    orientation: 'landscape',
    content_filter: 'high',
    order_by: 'relevant',
  });

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn(`Unsplash API error ${res.status}`);
    return [];
  }

  const data = (await res.json()) as { results?: UnsplashPhoto[] };
  return data.results || [];
}

function pickUniquePhoto(
  photos: UnsplashPhoto[],
  excludePhotoIds: Set<string>,
  terms: string[] = []
): UnsplashPhoto | null {
  const ranked = photos
    .filter((photo) => {
      if (!photo.urls?.regular) return false;
      const keys = photoIdentityKeys({ id: photo.id, url: photo.urls.regular });
      return keys.length > 0 && !isExcluded(keys, excludePhotoIds);
    })
    .map((photo) => ({ photo, score: scorePhoto(photo, terms) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.photo || null;
}

function pickUniqueDeskFallback(category: string, excludePhotoIds: Set<string>): string {
  const pool = [
    ...(DESK_FALLBACK_POOL[category] || []),
    ...Object.values(DESK_FALLBACK_POOL).flat(),
  ];
  for (const url of pool) {
    const keys = photoIdentityKeys({ url });
    if (isExcluded(keys, excludePhotoIds)) continue;
    markUsed(keys, excludePhotoIds);
    return url;
  }
  return deskHeroImage(category);
}

/** Fetch a unique landscape hero image from Unsplash, or fall back to an unused desk image. */
export async function fetchUnsplashHeroImage(input: HeroImageInput): Promise<HeroImageResult> {
  const category = input.category || 'cybersecurity';
  const key = getUnsplashAccessKey();
  const excludePhotoIds = input.excludePhotoIds || new Set<string>();
  const terms = relevanceTerms(input);

  if (!key) {
    const url = pickUniqueDeskFallback(category, excludePhotoIds);
    return {
      url,
      source: 'fallback',
      query: buildUnsplashQuery(input),
      photoId: photoIdFromUrl(url) || undefined,
    };
  }

  try {
    for (let variant = 0; variant < 4; variant++) {
      const query = buildUnsplashQuery(input, variant);
      for (let page = 1; page <= 4; page++) {
        const photos = await searchUnsplashPhotos(query, key, page);
        const photo = pickUniquePhoto(photos, excludePhotoIds, terms);
        if (!photo?.urls?.regular) continue;

        const keys = photoIdentityKeys({ id: photo.id, url: photo.urls.regular });
        markUsed(keys, excludePhotoIds);
        const cdnId = photoIdFromUrl(photo.urls.regular);

        return {
          url: toHeroUrl(photo.urls.regular),
          source: 'unsplash',
          query,
          photoId: cdnId || photo.id || undefined,
          photographer: photo.user?.name,
        };
      }
    }

    const url = pickUniqueDeskFallback(category, excludePhotoIds);
    return {
      url,
      source: 'fallback',
      query: buildUnsplashQuery(input),
      photoId: photoIdFromUrl(url) || undefined,
    };
  } catch (err) {
    console.warn('Unsplash fetch failed:', err);
    const url = pickUniqueDeskFallback(category, excludePhotoIds);
    return {
      url,
      source: 'fallback',
      query: buildUnsplashQuery(input),
      photoId: photoIdFromUrl(url) || undefined,
    };
  }
}

/**
 * Load photo ids already used on posts.
 * Stores CDN photo- ids so they match future Unsplash URL checks.
 */
export async function loadUsedHeroPhotoIds(
  rows: Array<{ id?: string; featured_image?: string | null }>,
  options?: { excludePostId?: string }
): Promise<Set<string>> {
  const used = new Set<string>();
  for (const row of rows) {
    if (options?.excludePostId && row.id === options.excludePostId) continue;
    for (const key of photoIdentityKeys({ url: row.featured_image })) {
      used.add(key);
    }
  }
  return used;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
