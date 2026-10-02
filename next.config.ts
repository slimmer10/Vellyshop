import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile higher up the drive is ignored.
  turbopack: { root: path.resolve(process.cwd()) },
  images: {
    remotePatterns: [
      // Catalogue photography. Swap this for the real product-photo host.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Google account avatars.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
