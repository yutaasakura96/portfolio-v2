import { GoogleAnalytics } from "@/components/public/GoogleAnalytics";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { prisma } from "@/lib/prismaClient";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { googleAnalyticsId: true },
  });

  return (
    <>
      {settings?.googleAnalyticsId && <GoogleAnalytics gaId={settings.googleAnalyticsId} />}
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
