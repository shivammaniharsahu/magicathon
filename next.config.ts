import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Placeholder / seed images
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // AI image generation
      { protocol: "https", hostname: "image.pollinations.ai" },
      // Common avatar/CDN hosts
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
