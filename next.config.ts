import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking during build (handled by IDE/CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Skip ESLint during build (handled separately)
};

export default nextConfig;
