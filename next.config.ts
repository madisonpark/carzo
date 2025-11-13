import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root warning - use dynamic path instead of hardcoded
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
