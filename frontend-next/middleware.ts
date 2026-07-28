import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Pass-through middleware; SEO files excluded so Googlebot never hits auth/routing logic. */
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|sitemap/.*|site\\.webmanifest|icon\\.png|apple-icon\\.png|manifest\\.webmanifest).*)',
  ],
};
