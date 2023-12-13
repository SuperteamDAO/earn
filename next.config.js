/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      '@chakra-ui/react',
      '@chakra-ui/icons',
      '@emotion/react',
      'react-hot-toast',
      'react-icons/ti',
      'react-icons/ai',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-base',
      '@solana/web3.js',
    ],
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
module.exports = nextConfig;
