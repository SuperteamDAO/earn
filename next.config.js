/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-var-requires */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  eslint: {
    dirs: ['.'],
  },
  poweredByHeader: false,
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    const headers = [];

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
};

module.exports = withPWA(
  withSentryConfig(
    nextConfig,
    {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    },
    {
      widenClientFileUpload: true,
      transpileClientSDK: true,
      tunnelRoute: '/monitoring',
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    },
  ),
);
