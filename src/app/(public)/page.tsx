import { CTASection } from "@/components/public/CTASection";
import { FeaturedProjects } from "@/components/public/FeaturedProjects";
import { HeroSection } from "@/components/public/HeroSection";
import { JsonLd } from "@/components/public/JsonLd";
import { RecentPosts } from "@/components/public/RecentPosts";
import { getFeaturedProjects, getHero, getRecentPosts } from "@/lib/data/public-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cloud-Native Software Engineer · AWS & Azure",
  description:
    "Yuta Asakura is a software engineer at Sogo & Seibu in Japan, building cloud-native applications across AWS and Azure. 7x AWS and 3x Azure certified.",
};

export const revalidate = 60;

export default async function HomePage() {
  const [hero, featuredProjects, recentPosts] = await Promise.all([
    getHero(),
    getFeaturedProjects(4),
    getRecentPosts(3),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Yuta Asakura",
          url: "https://asakurayuta.dev",
          jobTitle: "DX Software Engineer",
          worksFor: {
            "@type": "Organization",
            name: "Sogo & Seibu",
            url: "https://www.sogo-seibu.co.jp/",
          },
          knowsAbout: [
            "cloud-native",
            "multi-cloud",
            "AWS",
            "Microsoft Azure",
            "Next.js",
            "TypeScript",
            "React",
          ],
          sameAs: [
            "https://github.com/yutaasakura96",
            "https://linkedin.com/in/yuta-asakura",
            "https://www.wantedly.com/id/yuta_asakura",
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Yuta Asakura | Portfolio",
          url: "https://asakurayuta.dev",
          description:
            "Yuta Asakura is a software engineer at Sogo & Seibu in Japan, building cloud-native applications across AWS and Azure. 7x AWS and 3x Azure certified.",
        }}
      />
      {hero && <HeroSection hero={hero} />}
      {featuredProjects.length > 0 && <FeaturedProjects projects={featuredProjects} />}
      {recentPosts.length > 0 && <RecentPosts posts={recentPosts} />}
      <CTASection />
    </>
  );
}
