/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external images if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covaera.com',
      },
    ],
  },
  // Environment variable validation
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
}

export default nextConfig
