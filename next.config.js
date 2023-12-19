/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    nextScriptWorkers: true,
  },
  eslint: {
    dirs: ['.'],
  },
  poweredByHeader: false,
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
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

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled:
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
