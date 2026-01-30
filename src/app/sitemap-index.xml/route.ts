import { NextResponse } from 'next/server';

import { getSiteUrl, isProductionEnv } from '@/lib/site-url';

import { generateSitemaps } from '../sitemap';

export const revalidate = 86400;

const baseUrl = getSiteUrl();

/**
 * Escapes XML special characters to prevent injection attacks
 * @param text - The text to escape
 * @returns Escaped text safe for XML content
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapIndex(sitemapUrls: string[]): string {
  const lastMod = new Date().toISOString();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const sitemapUrl of sitemapUrls) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(sitemapUrl)}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }

  xml += '</sitemapindex>';
  return xml;
}

export async function GET(): Promise<NextResponse> {
  // Get all sitemap IDs from generateSitemaps()
  if (!isProductionEnv()) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
      {
        headers: {
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control':
            'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400',
        },
      },
    );
  }

  let sitemaps: Array<{ id: number }> = [];
  try {
    sitemaps = await generateSitemaps();
  } catch (error) {
    console.error('Error generating sitemap IDs:', error);
  }

  // Start with static sitemap
  const sitemapUrls: string[] = [`${baseUrl}/sitemap-static.xml`];

  // Add dynamic sitemaps
  const dynamicSitemapUrls = sitemaps.map(
    (sitemap) => `${baseUrl}/sitemap/${sitemap.id}.xml`,
  );
  sitemapUrls.push(...dynamicSitemapUrls);

  const sitemapIndexXML = buildSitemapIndex(sitemapUrls);

  return new NextResponse(sitemapIndexXML, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Content-Length': Buffer.byteLength(sitemapIndexXML).toString(),
      'Cache-Control':
        'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400',
    },
  });
}
