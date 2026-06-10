import "highlight.js/styles/github-dark.css";
import { BreadcrumbJsonLd } from "@/components/public/BreadcrumbJsonLd";
import { JsonLd } from "@/components/public/JsonLd";
import { LocalizedHtml, LocalizedText, LocalizedUi } from "@/components/public/LocalizedContent";
import { getPostBySlug, getPublishedPostSlugs } from "@/lib/data/public-queries";
import { TableOfContents } from "@/components/public/TableOfContents";
import { extractHeadings, markdownToHtml } from "@/lib/markdown";
import { formatReadingTime } from "@/lib/reading-time";
import SocialShareButtons from "@/components/public/SocialShareButtons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

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
      tags: post.tags,
      images: [{ url: `/blog/${slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`/blog/${slug}/opengraph-image`],
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
  const contentHtmlJa = post.contentJa ? await markdownToHtml(post.contentJa) : null;
  const headings = extractHeadings(post.content);
  const showToc = headings.length >= 2;

  return (
    <div className={cn("mx-auto px-4 sm:px-6 py-12", showToc ? "max-w-5xl" : "max-w-3xl")}>
      <div className={cn(showToc && "lg:grid lg:grid-cols-[1fr_220px] lg:gap-10")}>
        <article>
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: "https://asakurayuta.dev" },
              { name: "Blog", url: "https://asakurayuta.dev/blog" },
              { name: post.title, url: `https://asakurayuta.dev/blog/${post.slug}` },
            ]}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              image: post.featuredImage,
              datePublished: post.publishedAt?.toISOString(),
              author: {
                "@type": "Person",
                name: "Yuta Asakura",
              },
            }}
          />

          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <LocalizedUi k="allPosts" />
          </Link>

          {/* Header */}
          <header className="mb-8">
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <LocalizedText
              en={post.title}
              ja={post.titleJa}
              as="h1"
              className="text-3xl font-bold text-foreground sm:text-4xl"
            />

            {/* Meta */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
              {post.readTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatReadingTime(post.readTime)}
                </span>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted mb-8">
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

          {/* Mobile TOC */}
          {showToc && <TableOfContents headings={headings} variant="mobile" />}

          {/* Content */}
          <LocalizedHtml
            enHtml={contentHtml}
            jaHtml={contentHtmlJa}
            className="prose prose-gray prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400 prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-img:shadow-md"
          />

          {/* Bottom CTA */}
          <div className="mt-12 pt-8 border-t border-border space-y-4">
            <SocialShareButtons
              url={`https://asakurayuta.dev/blog/${post.slug}`}
              title={post.title}
            />
            <p className="text-muted-foreground">
              <LocalizedUi k="enjoyedPost" />{" "}
              <Link href="/contact" className="text-foreground font-medium hover:underline">
                <LocalizedUi k="getInTouch" />
              </Link>{" "}
              <LocalizedUi k="getLoveToHear" />
            </p>
          </div>
        </article>

        {/* Desktop TOC sidebar */}
        {showToc && <TableOfContents headings={headings} variant="desktop" />}
      </div>
    </div>
  );
}
