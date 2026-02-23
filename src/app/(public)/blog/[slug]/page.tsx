import { getPostBySlug, getPublishedPostSlugs } from "@/lib/data/public-queries";
import { markdownToHtml } from "@/lib/markdown";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 1800;

export async function generateStaticParams() {
  const posts = await getPublishedPostSlugs();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      ...(post.featuredImage
        ? { images: [{ url: post.featuredImage, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const contentHtml = await markdownToHtml(post.content);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Posts
      </Link>

      {/* Header */}
      <header className="mb-8">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{post.title}</h1>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          {post.publishedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </span>
          )}
          {post.readTime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime} min read
            </span>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-8">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-gray prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-img:shadow-md"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Bottom CTA */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-gray-600">
          Enjoyed this post?{" "}
          <Link href="/contact" className="text-gray-900 font-medium hover:underline">
            Get in touch
          </Link>{" "}
          — I&apos;d love to hear your thoughts.
        </p>
      </div>
    </article>
  );
}
