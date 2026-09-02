import type { MetadataRoute } from "next";
import {
  getPublishedPostSitemapEntries,
  getPublishedProjectSitemapEntries,
} from "@/lib/data/public-queries";

/**
 * Cache the sitemap for 24h.
 *
 * This used to be `force-dynamic`, which meant every crawler hit ran two live
 * Prisma queries. `robots.ts` advertises this route to every bot, so that was an
 * unbounded, bot-driven wake source for the Neon compute (which only scales to
 * zero after 5 idle minutes). A sitemap does not need to be real-time; if
 * near-instant freshness is ever required, call `revalidatePath("/sitemap.xml")`
 * from the publish path instead of reverting to `force-dynamic`.
 */
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://asakurayuta.dev";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  const [projects, posts] = await Promise.all([
    getPublishedProjectSitemapEntries(),
    getPublishedPostSitemapEntries(),
  ]);

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: project.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...projectPages, ...postPages];
}
