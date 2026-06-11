import { BlogBrowser } from "@/components/public/BlogBrowser";
import { LocalizedUi } from "@/components/public/LocalizedContent";
import { getPublishedPosts } from "@/lib/data/public-queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Technical blog posts by Yuta Asakura on web development, AWS, TypeScript, and software engineering.",
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-10">
        <LocalizedUi k="blog" as="h1" className="text-3xl font-bold text-foreground sm:text-4xl" />
        <LocalizedUi
          k="blogPageDescription"
          as="p"
          className="mt-3 text-muted-foreground max-w-lg"
        />
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <BlogBrowser posts={posts} />
      </Suspense>
    </div>
  );
}
