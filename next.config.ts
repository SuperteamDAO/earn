import type { NextConfig } from 'next';

// The Content-Security-Policy is set per document in src/proxy.ts (Privy
// and KYC pages get their own), not here.
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@walletconnect/logger': './src/shims/walletconnect-logger.ts',
      pino: 'pino/browser',
    },
  },
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
      '@radix-ui/react-*',
      '@solana/*',
      '@tiptap/*',
      'ai',
      'cmdk',
      'dayjs',
      'embla-carousel-autoplay',
      'embla-carousel-react',
      'flag-icons',
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
  async redirects() {
    return [
      {
        source: '/earn/api/email/unsubscribe/:path*',
        destination: '/api/email/unsubscribe/:path*',
        permanent: true,
      },
    ];
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
        source: '/cdn/bnbstatic/:path*',
        destination: 'https://bin.bnbstatic.com/:path*',
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
        source: '/cdn/imagedelivery/:path*',
        destination: 'https://imagedelivery.net/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
