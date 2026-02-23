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
  title: {
    default: "Yuta Asakura | Full-Stack Developer",
    template: "%s | Yuta Asakura",
  },
  description:
    "Full-stack developer specializing in React, Next.js, and AWS. View my projects, blog posts, and experience.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
