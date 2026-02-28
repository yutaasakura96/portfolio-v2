import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Turbopack workspace root detection when a stray package-lock.json
  // exists in a parent directory (e.g. /Documents/GitHub/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  // Required for sharp to work in Next.js 15+ serverless/Amplify environments
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
