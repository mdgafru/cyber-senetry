import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

/** Always return 200 + full XML (avoids 304 empty body that breaks GSC). */
export async function GET() {
  const xml = readFileSync(join(process.cwd(), 'public', 'sitemap', 'sitemap.xml'), 'utf8');
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
