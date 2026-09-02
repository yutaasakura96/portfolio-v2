import type { NextConfig } from "next";
import path from "node:path";
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
  // Shared ISR cache backed by Upstash Redis. Amplify runs this app across
  // multiple Lambda instances, and Next's default per-instance filesystem cache
  // means `revalidatePath()` only invalidates the instance that handled the
  // mutation. See the header comment in cache-handler.js for the full rationale.
  //
  // The file is plain CommonJS at the repo root because Next `import()`s it from
  // disk at runtime — it is NOT part of the bundle graph, so it needs no entry in
  // `serverExternalPackages`. `outputFileTracingIncludes` is belt-and-braces to
  // guarantee it lands in the Amplify compute bundle.
  cacheHandler: path.join(__dirname, "cache-handler.js"),
  cacheMaxMemorySize: 0, // the handler does its own bounded in-process caching
  outputFileTracingIncludes: {
    "/**/*": ["./cache-handler.js"],
  },
  // Required for sharp to work in Next.js 15+ serverless/Amplify environments
  serverExternalPackages: ["sharp", "@neondatabase/serverless", "@prisma/adapter-neon"],
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
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
      {
        protocol: "https",
        hostname: "images.credly.com",
      },
    ],
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: "personal-projects-ge",
  project: "portfolio-v2",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
