import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  const baseUrl = 'https://earn.superteam.fun';

  // For preview/staging environments, disallow everything
  if (!isProduction) {
    const robotsTxt = `User-agent: *
Disallow: /`;

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /auth/
Disallow: /signin
Disallow: /signup
Sitemap: ${baseUrl}/sitemap-index.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
