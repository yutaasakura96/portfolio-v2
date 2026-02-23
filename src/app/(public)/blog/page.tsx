import { BlogPostCard } from "@/components/public/BlogPostCard";
import { getPublishedPosts } from "@/lib/data/public-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts on web development, software engineering, and technology.",
};

export const revalidate = 1800;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
        <p className="mt-2 text-gray-600">
          Thoughts on web development, software engineering, and technology.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No blog posts published yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
