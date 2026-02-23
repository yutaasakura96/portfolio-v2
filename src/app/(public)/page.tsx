import { CTASection } from "@/components/public/CTASection";
import { FeaturedProjects } from "@/components/public/FeaturedProjects";
import { HeroSection } from "@/components/public/HeroSection";
import { RecentPosts } from "@/components/public/RecentPosts";
import { getFeaturedProjects, getHero, getRecentPosts } from "@/lib/data/public-queries";

export const revalidate = 3600; // ISR: revalidate every hour

export default async function HomePage() {
  const [hero, featuredProjects, recentPosts] = await Promise.all([
    getHero(),
    getFeaturedProjects(4),
    getRecentPosts(3),
  ]);

  return (
    <>
      {hero && <HeroSection hero={hero} />}
      {featuredProjects.length > 0 && <FeaturedProjects projects={featuredProjects} />}
      {recentPosts.length > 0 && <RecentPosts posts={recentPosts} />}
      <CTASection />
    </>
  );
}
