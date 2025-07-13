/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable standalone output for Docker
    outputStandalone: true,
  },
  // Disable telemetry
  telemetry: false,
  // Enable static exports if needed
  trailingSlash: true,
  // Optimize images
  images: {
    unoptimized: true,
  },
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig; 