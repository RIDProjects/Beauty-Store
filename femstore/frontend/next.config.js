/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // No hardcodear API URL - usar variables de entorno de Vercel
  // Si NEXT_PUBLIC_API_URL está vacío, usa ruta relativa (/api)
};

module.exports = nextConfig;
