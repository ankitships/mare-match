/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  typescript: {
    // Allow build to continue even if types slip — hackathon velocity
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
