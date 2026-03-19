import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@maisum/shared', '@maisum/ui'],
}

export default nextConfig
