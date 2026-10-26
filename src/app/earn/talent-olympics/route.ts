import type { NextRequest } from 'next/server';

// An old hackathon URL.
export function GET(request: NextRequest) {
  return new Response(null, {
    status: 308,
    headers: {
      Location: new URL('/earn/hackathon/talent-olympics/', request.nextUrl)
        .href,
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
