import type { NextRequest } from 'next/server';

// An old hackathon URL.
export function GET(request: NextRequest) {
  return Response.redirect(
    new URL('/earn/hackathon/renaissance/', request.nextUrl),
    308,
  );
}
