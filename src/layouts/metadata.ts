import type { Metadata } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { AppConfig } from '@/utils/AppConfig';

interface MetadataProps {
  readonly title: string;
  readonly description: string;
  readonly canonical?: string;
  readonly og?: string;
  readonly ogWidth?: number;
  readonly ogHeight?: number;
}

export function generatePageMetadata({
  title,
  description,
  canonical,
  og,
  ogWidth = 1200,
  ogHeight = 630,
}: MetadataProps): Metadata {
  const ogImage = og ?? `${ASSET_URL}/og/og.png`;

  return {
    title,
    description,
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      locale: AppConfig.locale,
      siteName: AppConfig.site_name,
      images: [
        {
          url: ogImage,
          width: ogWidth,
          height: ogHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@SuperteamEarn',
      creator: '@SuperteamEarn',
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png' }],
    },
  };
}
