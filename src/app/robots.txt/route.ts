import { NextResponse } from 'next/server';

import { getSiteUrl, isProductionEnv } from '@/lib/site-url';

import { generateSitemaps } from '../sitemap';

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

  let sitemapLines = '';
  try {
    const sitemaps = await generateSitemaps();
    sitemapLines = sitemaps
      .map((sitemap) => `Sitemap: ${baseUrl}/sitemap/${sitemap.id}.xml`)
      .join('\n');
  } catch (error) {
    console.error('Error generating robots sitemap entries:', error);
  }

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /earn/dashboard/
Disallow: /auth/
Disallow: /earn/signin
Disallow: /earn/signup
# AI Agents: See skill.md for API documentation
# Skill: ${baseUrl}/skill.md
# Heartbeat: ${baseUrl}/heartbeat.md
${sitemapLines}`.trim();

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
