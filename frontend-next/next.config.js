/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/api/robots.txt', destination: '/robots.txt', permanent: true },
    ];
  },
};

module.exports = nextConfig;
