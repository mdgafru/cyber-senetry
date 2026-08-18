/** Facebook / LinkedIn / Instagram link-preview size (1.91:1). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const DEFAULT_OG =
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&h=630&q=85';

/** Absolute HTTPS thumbnail sized for social crawlers. */
export function toOgImageUrl(raw?: string | null): string {
  const src = (raw && String(raw).trim()) || DEFAULT_OG;
  try {
    const u = new URL(src.startsWith('http') ? src : `https://${src}`);
    if (u.protocol !== 'https:') u.protocol = 'https:';
    if (u.hostname.includes('unsplash.com')) {
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(OG_IMAGE_WIDTH));
      u.searchParams.set('h', String(OG_IMAGE_HEIGHT));
      u.searchParams.set('q', '85');
    }
    return u.toString();
  } catch {
    return DEFAULT_OG;
  }
}

export function ogImageMeta(raw: string | null | undefined, alt: string) {
  const url = toOgImageUrl(raw);
  return {
    url,
    secureUrl: url,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    type: 'image/jpeg' as const,
    alt,
  };
}
