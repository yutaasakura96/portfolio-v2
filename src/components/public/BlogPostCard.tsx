import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatReadingTime } from "@/lib/reading-time";

interface BlogPostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    featuredImage: string | null;
    tags: string[];
    readTime: number | null;
    publishedAt: Date | null;
  };
  index?: number;
}

export function BlogPostCard({ post, index = 0 }: BlogPostCardProps) {
  return (
    <article
      className="card-interactive group rounded-xl border border-border bg-card overflow-hidden stagger-item"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Featured Image */}
      {post.featuredImage && (
        <Link href={`/blog/${post.slug}`}>
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
          </div>
        </Link>
      )}

      <div className="p-5">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-[var(--accent-signature)] transition-colors duration-200 line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {post.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(post.publishedAt), "MMM d, yyyy")}
            </span>
          )}
          {post.readTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatReadingTime(post.readTime)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
