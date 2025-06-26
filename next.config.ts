import { type NextConfig } from 'next';

/* eslint-disable @typescript-eslint/no-var-requires */
const { withAxiom } = require('next-axiom');

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
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://us-assets.i.posthog.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com;
  img-src 'self' blob: data: https://res.cloudinary.com https://*.googleusercontent.com https://s2.coinmarketcap.com https://googletagmanager.com https://assets.coingecko.com https://avatars.githubusercontent.com;
  connect-src 'self' blob:  https://auth.privy.io https://*.rpc.privy.systems https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://api.testnet.solana.com https://us.i.posthog.com https://app.posthog.com https://*.helius-rpc.com wss://mainnet.helius-rpc.com https://ipapi.co wss://earn-vibe-production.up.railway.app https://verify.walletconnect.com https://verify.walletconnect.org https://res.cloudinary.com https://www.google-analytics.com;
  font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
  child-src 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
  frame-src 'self' https://auth.privy.io https://*.sumsub.com https://verify.walletconnect.com https://verify.walletconnect.org https://www.youtube.com;
  frame-ancestors 'self' https://*.sumsub.com;
  ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
`;

const csp = baseCsp.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['.'],
  },
  poweredByHeader: false,
  trailingSlash: true,
  reactStrictMode: true,
  images: {
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
    optimizePackageImports: [
      '@privy-io/*',
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
      'next-seo',
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
  async headers() {
    const headers = [];

    headers.push({
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'Content-Security-Policy',
          value: csp,
        },
      ],
    });

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
      headers.push({
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      });
    }

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
    ];
  },
};

const combinedConfig = withAxiom(withPWA(nextConfig));

module.exports = combinedConfig;
