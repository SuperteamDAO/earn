import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  const pathname = request.nextUrl.pathname;

  // Skip redirect for API routes and Next.js internal routes
  const shouldSkipRedirect =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap');

  if (shouldSkipRedirect) {
    return NextResponse.next();
  }

  // Check if this is a direct request to testearn (not proxied from test.superteam.fun)
  const isDirectTestearnRequest =
    host.includes('testearn.superteam.fun') &&
    forwardedHost !== 'test.superteam.fun';

  if (isDirectTestearnRequest) {
    // If path already starts with /earn, use it directly
    // If not, prepend /earn (handles legacy URLs without basePath)
    const targetPath = pathname.startsWith('/earn')
      ? pathname
      : `/earn${pathname}`;

    const redirectUrl = new URL(targetPath, 'https://test.superteam.fun');

    // Preserve query string
    redirectUrl.search = request.nextUrl.search;

    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths including root, except static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (assets, etc.)
     */
    '/',
    '/((?!_next/static|_next/image|favicon.ico|assets|sw.js|workbox-).*)',
  ],
};
