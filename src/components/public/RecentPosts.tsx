"use client";

import { BlogPostCard } from "@/components/public/BlogPostCard";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  tags: string[];
  readTime: number | null;
  publishedAt: Date | null;
}

interface RecentPostsProps {
  posts: RecentPost[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  const { ref, visible } = useReveal();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn("reveal py-14 sm:py-16 border-border", visible && "visible")}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-[var(--accent-signature)] mb-1">Blog</p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Recent Posts</h2>
          </div>
          <Link
            href="/blog"
            className="arrow-link inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4 arrow-icon" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <BlogPostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
