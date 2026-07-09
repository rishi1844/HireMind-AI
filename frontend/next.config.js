/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "65.1.63.43",
      "vita.genixpay.com",
      "models.readyplayer.me",
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "65.1.63.43",
        "65.1.63.43:3000",
        "vita.genixpay.com",
        "www.vita.genixpay.com",
      ],
    },
  },
  // Allow Three.js / R3F to work correctly with Next.js
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

module.exports = nextConfig;
