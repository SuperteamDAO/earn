/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-var-requires */
const { withAxiom } = require('next-axiom');
const { withSentryConfig } = require('@sentry/nextjs');
const { i18n } = require('./next-i18next.config');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  typescript: {
    // https://nextjs.org/docs/app/api-reference/next-config-js/typescript
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ['.'],
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ['@premieroctet/next-admin'],
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
  experimental: {
    swcPlugins: [
      [
        'next-superjson-plugin',
        {
          excluded: [],
        },
      ],
    ],
  },
};

const combinedConfig = withAxiom(withPWA(nextConfig));

module.exports = withSentryConfig(combinedConfig, {
  i18n,
  org: 'superteam-7o',
  project: 'earn',
  silent: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});
