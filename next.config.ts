import { type NextConfig } from 'next';

/* eslint-disable @typescript-eslint/no-var-requires */
const { withAxiom } = require('next-axiom');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const baseCsp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://us-assets.i.posthog.com;
  style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com;
  img-src 'self' blob: data: https://res.cloudinary.com https://*.googleusercontent.com https://s2.coinmarketcap.com https://assets.coingecko.com https://avatars.githubusercontent.com;
  connect-src 'self' blob:  https://auth.privy.io https://*.rpc.privy.systems https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://api.testnet.solana.com https://us.i.posthog.com https://app.posthog.com https://*.helius-rpc.com wss://mainnet.helius-rpc.com https://ipapi.co wss://earn-vibe-production.up.railway.app https://verify.walletconnect.com https://verify.walletconnect.org;
  font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
  child-src 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
  frame-src 'self' https://auth.privy.io https://*.sumsub.com https://verify.walletconnect.com https://verify.walletconnect.org;
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
      '@radix-ui/react-icons',
      'react-icons',
      'flag-icons',
      '@tiptap/core',
      'react-select',
      'posthog-js',
      'posthog-js/react',
      'lowlight',
      'zod',
      '@privy-io/react-auth',
      '@privy-io/server-auth',
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
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};

const combinedConfig = withAxiom(withPWA(nextConfig));

module.exports = combinedConfig;
