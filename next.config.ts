import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Keep production builds stable on Windows and small CI runners.
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
  reactStrictMode: true,
}

export default nextConfig
