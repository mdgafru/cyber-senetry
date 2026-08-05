/** URL-safe tag slug: "AI Security" → "ai-security" (no %20). */
export function tagToSlug(tag: string): string {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function tagHref(tag: string): string {
  return `/tag/${tagToSlug(tag)}`;
}
