import { QueryProvider } from "@/components/providers/QueryProvider";
import "highlight.js/styles/github-dark.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://asakurayuta.dev"),
  title: {
    default: "Yuta Asakura | Full-Stack Developer",
    template: "%s | Yuta Asakura",
  },
  description:
    "Full-stack developer portfolio showcasing projects built with Next.js, TypeScript, AWS, and modern web technologies.",
  keywords: [
    "full-stack developer",
    "software engineer",
    "web developer",
    "Next.js",
    "TypeScript",
    "AWS",
    "React",
    "portfolio",
  ],
  authors: [{ name: "Yuta Asakura" }],
  creator: "Yuta Asakura",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://asakurayuta.dev",
    siteName: "Yuta Asakura | Portfolio",
    title: "Yuta Asakura | Full-Stack Developer",
    description:
      "Full-stack developer portfolio showcasing projects built with Next.js, TypeScript, AWS, and modern web technologies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuta Asakura | Full-Stack Developer",
    description:
      "Full-stack developer portfolio showcasing projects built with Next.js, TypeScript, AWS, and modern web technologies.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_CLOUDFRONT_URL && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_CLOUDFRONT_URL} />
        )}
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
