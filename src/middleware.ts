import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'GOD') {
      const url = new URL('/unauthorized', request.nextUrl.origin);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  return NextResponse.next();
}