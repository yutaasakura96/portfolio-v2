import { BlogPostCard } from "@/components/public/BlogPostCard";
import { getPublishedPosts } from "@/lib/data/public-queries";
import { Metadata } from "next";

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
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Blog</h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          Thoughts on web development, software engineering, and technology.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <BlogPostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No blog posts published yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
