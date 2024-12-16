/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-var-requires */
const { withAxiom } = require('next-axiom');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
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
      'flag-icons',
      '@/features/auth',
      '@/features/comments',
      '@/features/conversion-popups',
      '@/features/emails',
      '@/features/feed',
      '@/features/home',
      '@/features/leaderboard',
      '@/features/listing-builder',
      '@/features/listings',
      '@/features/navbar',
      '@/features/search',
      '@/features/social',
      '@/features/sponsor',
      '@/features/sponsor-dashboard',
      '@/features/talent',
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
