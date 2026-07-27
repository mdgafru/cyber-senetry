import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const revalidate = 3600;

/** Serve build-time sitemap without Content-Disposition: inline (GSC-friendly). */
export async function GET() {
  const xml = readFileSync(join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
