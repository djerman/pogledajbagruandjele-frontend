import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '185.229.119.44',
        port: '8155',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: '**.directus.app',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
