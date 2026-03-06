import { CTASection } from "@/components/public/CTASection";
import { FeaturedProjects } from "@/components/public/FeaturedProjects";
import { HeroSection } from "@/components/public/HeroSection";
import { JsonLd } from "@/components/public/JsonLd";
import { RecentPosts } from "@/components/public/RecentPosts";
import { getFeaturedProjects, getHero, getRecentPosts } from "@/lib/data/public-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Yuta Asakura — Full-stack developer building modern web applications with Next.js, TypeScript, and AWS.",
};

export const revalidate = 3600; // ISR: revalidate every hour

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
          jobTitle: "Full-Stack Developer",
          sameAs: [
            "https://github.com/yutaasakura96",
            "https://linkedin.com/in/yuta-asakura",
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
            "Full-stack developer portfolio showcasing projects built with Next.js, TypeScript, AWS, and modern web technologies.",
        }}
      />
      {hero && <HeroSection hero={hero} />}
      {featuredProjects.length > 0 && <FeaturedProjects projects={featuredProjects} />}
      {recentPosts.length > 0 && <RecentPosts posts={recentPosts} />}
      <CTASection />
    </>
  );
}
