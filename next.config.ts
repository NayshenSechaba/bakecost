import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow next/image to serve local images without the optimization API
    // This ensures logos load correctly in all deployment environments
    unoptimized: true,
  },
};

export default nextConfig;
