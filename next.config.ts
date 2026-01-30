import { type NextConfig } from 'next';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withAxiom } = require('next-axiom');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/docs-keep\//,
      handler: 'NetworkOnly',
      method: 'POST',
    },
    {
      urlPattern: /^\/docs-keep\//,
      handler: 'NetworkOnly',
      method: 'GET',
    },
  ],
});

const baseCsp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://us-assets.i.posthog.com https://www.google-analytics.com https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com https://us.posthog.com;
  img-src 'self' blob: data: https://res.cloudinary.com https://*.googleusercontent.com https://googletagmanager.com https://dl.airtable.com https://*.airtableusercontent.com;
  connect-src 'self' blob:  https://auth.privy.io https://*.rpc.privy.systems https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://api.testnet.solana.com https://us.i.posthog.com https://app.posthog.com https://internal-j.posthog.com https://us.posthog.com https://*.helius-rpc.com wss://mainnet.helius-rpc.com https://ipapi.co wss://earn-vibe-production.up.railway.app https://verify.walletconnect.com https://verify.walletconnect.org https://res.cloudinary.com https://api.cloudinary.com https://www.google-analytics.com https://privy.earn.superteam.fun;
  media-src 'self' blob: data: https://res.cloudinary.com;
  font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  child-src 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://privy.earn.superteam.fun;
  frame-src 'self' https://auth.privy.io https://*.sumsub.com https://verify.walletconnect.com https://verify.walletconnect.org https://www.youtube.com https://challenges.cloudflare.com https://privy.earn.superteam.fun https://res.cloudinary.com;
  frame-ancestors 'self' https://*.sumsub.com;
  worker-src 'self';
  manifest-src 'self';
  ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
`;

const csp = baseCsp.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  // turbopack: {},
  poweredByHeader: false,
  trailingSlash: true,
  reactStrictMode: true,
  reactCompiler: false,
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // turbopackFileSystemCacheForDev: true,
    optimizePackageImports: [
      '@privy-io/react-auth',
      '@privy-io/node',
      '@radix-ui/react-*',
      '@solana/*',
      '@tanstack/react-query',
      '@tiptap/*',
      'ai',
      'cmdk',
      'dayjs',
      'embla-carousel-autoplay',
      'embla-carousel-react',
      'flag-icons',
      'jotai',
      'lowlight',
      'lucide-react',
      'nprogress',
      'posthog-js',
      'react-day-picker',
      'react-hook-form',
      'react-select',
      'sonner',
      'tailwind-merge',
      'typescript-cookie',
      'vaul',
      'zod',
    ],
  },
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom', 'parse5'],
  async headers() {
    const headers = [];

    headers.push({
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: csp },
      ],
    });

    const isPreviewEnv =
      process.env.VERCEL_ENV === 'preview' ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';

    if (isPreviewEnv) {
      headers.push({
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      });
    }

    headers.push({
      source: '/sitemap/:path*.xml',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/xml; charset=UTF-8',
        },
        {
          key: 'Cache-Control',
          value:
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400',
        },
      ],
    });

    headers.push({
      source: '/',
      headers: [
        {
          key: 'Link',
          value:
            '</assets/banner/banner-mobile.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high; media="(max-width: 639px)", </assets/banner/banner.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high; media="(min-width: 640px)"',
        },
      ],
    });

    headers.push({
      source: '/assets/banner/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    });

    return headers;
  },
  async rewrites() {
    return [
      {
        source: '/docs-keep/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/docs-keep/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/api/geo/world.geojson',
        destination:
          'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
      },
      {
        source: '/cdn/coinmarketcap/:path*',
        destination: 'https://s2.coinmarketcap.com/:path*',
      },
      {
        source: '/cdn/solscan/:path*',
        destination: 'https://statics.solscan.io/:path*',
      },
      {
        source: '/cdn/coingecko/:path*',
        destination: 'https://assets.coingecko.com/:path*',
      },
      {
        source: '/cdn/github/:path*',
        destination: 'https://avatars.githubusercontent.com/:path*',
      },
      {
        source: '/cdn/phantom/:path*',
        destination: 'https://api.phantom.app/:path*',
      },
      {
        source: '/cdn/arweave/:path*',
        destination: 'https://arweave.net/:path*',
      },
      {
        source: '/cdn/ipfs-io/:path*',
        destination: 'https://ipfs.io/:path*',
      },
      {
        source: '/cdn/imagedelivery/:path*',
        destination: 'https://imagedelivery.net/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

const combinedConfig = withAxiom(withPWA(nextConfig));

module.exports = combinedConfig;
