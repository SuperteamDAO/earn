import { type Metadata } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { normalizeCanonicalUrl } from '@/utils/canonical';

type Site = 'earn' | 'st';

const SITES: Record<
  Site,
  {
    readonly siteName: string;
    readonly twitter: string;
    readonly og: string;
    readonly icons: Metadata['icons'];
  }
> = {
  // Superteam Earn, under /earn.
  earn: {
    siteName: 'Superteam Earn',
    twitter: '@SuperteamEarn',
    og: `${ASSET_URL}/og/og.png`,
    icons: {
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon.ico' },
      ],
      apple: '/apple-touch-icon.png',
    },
  },
  // superteam.fun's own pages, at the root.
  st: {
    siteName: 'Superteam',
    twitter: '@Superteam',
    og: `${ASSET_URL}/st/og/og.png`,
    icons: { icon: [{ url: '/st-favicon.png', type: 'image/png' }] },
  },
};

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  readonly canonical?: string;
  // An absolute image URL; the site's default otherwise.
  readonly og?: string;
  readonly noIndex?: boolean;
  readonly site?: Site;
}

// A page's <head>, as Earn's <Meta> wrote it: title, description, canonical
// (only when indexable), Open Graph and Twitter cards, and noindex for
// dashboards and private pages. Use from `metadata`/`generateMetadata`.
export function pageMetadata({
  title,
  description,
  canonical,
  og,
  noIndex = false,
  site = 'earn',
}: PageMeta): Metadata {
  const config = SITES[site];
  const url = canonical && !noIndex ? normalizeCanonicalUrl(canonical) : null;
  const image = og ?? config.og;
  return {
    title: { absolute: title },
    description,
    icons: config.icons,
    ...(url ? { alternates: { canonical: url } } : {}),
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      ...(url ? { url } : {}),
      locale: 'en',
      siteName: config.siteName,
      images: [{ url: image, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: config.twitter,
      creator: config.twitter,
      description,
    },
  };
}
