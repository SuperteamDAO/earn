import { NextResponse } from 'next/server';

import { generateSitemaps } from '../sitemap';

export const revalidate = 86400;

const baseUrl = 'https://earn.superteam.fun';

function isProduction(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
}

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
  try {
    // Get all sitemap IDs from generateSitemaps()
    if (!isProduction()) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
        {
          headers: {
            'Content-Type': 'application/xml; charset=UTF-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        },
      );
    }

    const sitemaps = await generateSitemaps();

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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new NextResponse('Error generating sitemap index', {
      status: 500,
    });
  }
}
