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
    if (process.env.NODE_ENV === 'development') {
      return [
        { source: '/api/:path*',     destination: 'http://localhost:4000/api/:path*' },
        { source: '/uploads/:path*', destination: 'http://localhost:4000/uploads/:path*' },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
