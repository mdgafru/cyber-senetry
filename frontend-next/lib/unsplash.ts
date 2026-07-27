import { deskHeroImage } from './posts';

const DESK_QUERIES: Record<string, string> = {
  ai: 'artificial intelligence cybersecurity technology',
  cybersecurity: 'cybersecurity network security data center',
  threats: 'cyber threat hacking security operations',
  policy: 'compliance governance regulation technology',
  cloud: 'cloud computing security infrastructure',
  data: 'data privacy encryption analytics security',
};

export type HeroImageInput = {
  topic?: string | null;
  title?: string | null;
  category?: string | null;
  focusKeyword?: string | null;
  featuredImagePrompt?: string | null;
  keywords?: string[] | null;
  /** Skip photos already assigned to other articles in this batch. */
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
};

export function getUnsplashAccessKey(): string | null {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  return key || null;
}

/** Extract Unsplash photo id from CDN url (photo-{id} segment). */
export function photoIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/photo-([a-zA-Z0-9-]+)/);
  return match?.[1] || null;
}

export function toHeroUrl(regular: string): string {
  return `${regular.split('?')[0]}?auto=format&fit=crop&w=1600&q=85`;
}

/** Build a focused Unsplash search query from article metadata. */
export function buildUnsplashQuery(input: HeroImageInput): string {
  const category = (input.category || 'cybersecurity').toLowerCase();
  const deskQuery = DESK_QUERIES[category] || DESK_QUERIES.cybersecurity;

  const raw = [
    input.focusKeyword,
    ...(input.keywords || []).slice(0, 2),
    input.topic,
    input.title,
    input.featuredImagePrompt,
    deskQuery,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = [...new Set(raw.toLowerCase().split(' '))].filter((w) => w.length > 2);
  return words.slice(0, 10).join(' ') || deskQuery;
}

async function searchUnsplashPhotos(
  query: string,
  key: string,
  page: number,
  perPage = 15
): Promise<UnsplashPhoto[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    page: String(page),
    orientation: 'landscape',
    content_filter: 'high',
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
  excludePhotoIds: Set<string>
): UnsplashPhoto | null {
  for (const photo of photos) {
    const id = photo.id || photoIdFromUrl(photo.urls?.regular);
    if (!id || excludePhotoIds.has(id)) continue;
    if (!photo.urls?.regular) continue;
    return photo;
  }
  return null;
}

/** Fetch a unique landscape hero image from Unsplash, or fall back to desk default. */
export async function fetchUnsplashHeroImage(input: HeroImageInput): Promise<HeroImageResult> {
  const category = input.category || 'cybersecurity';
  const query = buildUnsplashQuery(input);
  const key = getUnsplashAccessKey();
  const excludePhotoIds = input.excludePhotoIds || new Set<string>();

  if (!key) {
    return { url: deskHeroImage(category), source: 'fallback', query };
  }

  try {
    for (let page = 1; page <= 3; page++) {
      const photos = await searchUnsplashPhotos(query, key, page);
      const photo = pickUniquePhoto(photos, excludePhotoIds);
      if (!photo?.urls?.regular) continue;

      const photoId = photo.id || photoIdFromUrl(photo.urls.regular) || undefined;
      if (photoId) excludePhotoIds.add(photoId);

      return {
        url: toHeroUrl(photo.urls.regular),
        source: 'unsplash',
        query,
        photoId,
        photographer: photo.user?.name,
      };
    }

    return { url: deskHeroImage(category), source: 'fallback', query };
  } catch (err) {
    console.warn('Unsplash fetch failed:', err);
    return { url: deskHeroImage(category), source: 'fallback', query };
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
