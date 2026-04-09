/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ai-info-fetcher'],
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
