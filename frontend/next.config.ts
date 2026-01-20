import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, context) => {
    if (context.dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;