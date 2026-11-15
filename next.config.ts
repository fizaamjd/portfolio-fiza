import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev overlay out of the way of the hero character.
  devIndicators: false,
  // Next 16 only allows listed qualities: 75 for thumbnails, 90 for photos shown large.
  images: { qualities: [75, 90] },
  async headers() {
    const year = "public, max-age=31536000, immutable";
    const day = "public, max-age=86400, stale-while-revalidate=604800";
    return [
      // the character files are requested with ?v=N, so they can be cached forever
      { source: "/models/:path*", headers: [{ key: "Cache-Control", value: year }] },
      { source: "/motion/:path*", headers: [{ key: "Cache-Control", value: day }] },
      // reel fonts are named by their content hash, so they never change
      { source: "/motion/fonts/:path*", headers: [{ key: "Cache-Control", value: year }] },
      { source: "/projects/:path*", headers: [{ key: "Cache-Control", value: day }] },
      { source: "/off-the-clock/:path*", headers: [{ key: "Cache-Control", value: day }] },
    ];
  },
};

export default nextConfig;
