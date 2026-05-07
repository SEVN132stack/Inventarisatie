/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Sla type-checking over tijdens Docker build (tsc loopt al apart)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
