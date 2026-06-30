import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/poikatsu-aggregator',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
