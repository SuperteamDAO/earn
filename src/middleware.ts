import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - refresh (the refresh page)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|refresh|assets).*)',
  ],
};

export function middleware(req: NextRequest) {
  // Bypass middleware when `privy_oauth_code` is a query parameter, as
  // we are in the middle of an authentication flow
  if (req.nextUrl.searchParams.get('privy_oauth_code')) {
    return NextResponse.next();
  }

  const cookieAuthToken = req.cookies.get('privy-token');
  const cookieSession = req.cookies.get('privy-session');

  const definitelyAuthenticated = !!cookieAuthToken;
  const maybeAuthenticated = !!cookieSession;

  if (!definitelyAuthenticated && maybeAuthenticated) {
    const redirectUri = req.nextUrl.pathname + req.nextUrl.search;
    const url = req.nextUrl.clone();
    url.pathname = '/refresh';
    url.searchParams.set('redirect_uri', redirectUri);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
