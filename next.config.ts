import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev overlay out of the way of the hero character.
  devIndicators: false,
  // Next 16 only allows listed qualities: 75 for thumbnails, 90 for photos shown large.
  images: { qualities: [75, 90] },
};

export default nextConfig;
