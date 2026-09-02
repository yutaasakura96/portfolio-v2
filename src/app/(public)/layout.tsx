import { GoogleAnalytics } from "@/components/public/GoogleAnalytics";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { getSiteSettings } from "@/lib/data/public-queries";
import { Toaster } from "@/components/ui/sonner";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Goes through the data layer (not raw Prisma) so it shares React `cache()`
  // with `Footer`, which needs the same row — one query per render, not two.
  const settings = await getSiteSettings();

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
