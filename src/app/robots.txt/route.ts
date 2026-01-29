import { NextResponse } from 'next/server';

import { getSiteUrl, isProductionEnv } from '@/lib/site-url';

export async function GET(): Promise<NextResponse> {
  const isProduction = isProductionEnv();
  const baseUrl = getSiteUrl();

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
Disallow: /earn/dashboard/
Disallow: /auth/
Disallow: /earn/signin
Disallow: /earn/signup
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-index.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
