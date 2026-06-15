import { GoogleAnalytics } from "@/components/public/GoogleAnalytics";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { prisma } from "@/lib/prisma-client";
import { Toaster } from "@/components/ui/sonner";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let settings: { googleAnalyticsId: string | null } | null = null;
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { googleAnalyticsId: true },
    });
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
  }

  return (
    <>
      {settings?.googleAnalyticsId && <GoogleAnalytics gaId={settings.googleAnalyticsId} />}
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster position="bottom-right" />
    </>
  );
}
