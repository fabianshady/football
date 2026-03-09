import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vpl0mb2pgnbucvy2.public.blob.vercel-storage.com',
      },
    ],
    // Use AVIF for better compression, then WebP as fallback
    formats: ['image/avif', 'image/webp'],
  },

  // Vercel automatically handles compression, but this ensures
  // the standalone server also compresses responses
  compress: true,

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'chart.js',
      'react-chartjs-2',
    ],
  },

  // Security & performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
