import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client-side SPA mode - no SSR
  output: "export",
  // Skip type checking during build (handled by IDE/CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Skip ESLint during build (handled separately)
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
