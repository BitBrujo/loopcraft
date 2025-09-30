import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Enable standalone output for Docker
  eslint: {
    // Skip ESLint during production builds in Docker
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type checking during production builds in Docker
    // Type checking should be done in development and CI
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
