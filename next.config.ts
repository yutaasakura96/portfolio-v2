import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Fix Turbopack workspace root detection when a stray package-lock.json
  // exists in a parent directory (e.g. /Documents/GitHub/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  // Required for sharp to work in Next.js 15+ serverless/Amplify environments
  serverExternalPackages: ["sharp"],
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  async headers() {
    return [
      {
        source: "/((?!api|_next|admin).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=10, stale-while-revalidate=31536000",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
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

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: "personal-projects-ge",
  project: "portfolio-v2",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
