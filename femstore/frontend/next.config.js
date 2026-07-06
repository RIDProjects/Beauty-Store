/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  async rewrites() {
    // Dev: proxy /api/* and /uploads/* to the Express backend on :4000
    // Production (Vercel): these rewrites don't apply — Vercel uses its own rewrite config
    if (process.env.NODE_ENV === 'development') {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${backendUrl}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
