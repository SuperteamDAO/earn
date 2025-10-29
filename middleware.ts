import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    // All paths except Next internals, API, and files with extensions
    '/((?!_next|api|.*\\..*).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = new URL(req.url);

  // bypass during OAuth flow or refresh page
  if (
    url.searchParams.has('privy_oauth_code') ||
    url.searchParams.has('privy_oauth_state') ||
    url.searchParams.has('privy_oauth_provider') ||
    url.pathname === '/refresh'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('privy-token');
  const session = req.cookies.get('privy-session');

  const definitelyAuthenticated = Boolean(token?.value);
  const maybeAuthenticated = Boolean(session?.value);

  if (!definitelyAuthenticated && maybeAuthenticated) {
    const redirectUrl = new URL('/refresh', req.url);
    redirectUrl.searchParams.set('redirect_url', url.href);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
