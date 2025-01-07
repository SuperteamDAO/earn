import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  if (!request.url.includes('/api/')) {
    return NextResponse.next();
  }

  const response = await NextResponse.next();

  if (response.status === 401) {
    response.headers.set('X-Auth-Error', 'true');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
