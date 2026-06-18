import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["WONK", "opsz", "SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://asakurayuta.dev"),
  title: {
    default: "Yuta Asakura | Cloud-Native Software Engineer · AWS & Azure",
    template: "%s | Yuta Asakura",
  },
  description:
    "Yuta Asakura is a software engineer at Sogo & Seibu in Japan, building cloud-native applications across AWS and Azure. 7x AWS and 3x Azure certified.",
  keywords: [
    "cloud-native",
    "software engineer",
    "multi-cloud",
    "AWS",
    "Azure",
    "software engineer Japan",
    "Sogo & Seibu",
  ],
  authors: [{ name: "Yuta Asakura" }],
  creator: "Yuta Asakura",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://asakurayuta.dev",
    siteName: "Yuta Asakura | Portfolio",
    title: "Yuta Asakura | Cloud-Native Software Engineer · AWS & Azure",
    description:
      "Yuta Asakura is a software engineer at Sogo & Seibu in Japan, building cloud-native applications across AWS and Azure. 7x AWS and 3x Azure certified.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuta Asakura | Cloud-Native Software Engineer · AWS & Azure",
    description:
      "Yuta Asakura is a software engineer at Sogo & Seibu in Japan, building cloud-native applications across AWS and Azure. 7x AWS and 3x Azure certified.",
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
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_CLOUDFRONT_URL && (
          <>
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_CLOUDFRONT_URL} />
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_CLOUDFRONT_URL} />
          </>
        )}
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <QueryProvider>{children}</QueryProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
