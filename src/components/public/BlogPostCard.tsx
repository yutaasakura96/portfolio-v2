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
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Featured Image */}
      {post.featuredImage && (
        <Link href={`/blog/${post.slug}`}>
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
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
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-muted-foreground transition-colors line-clamp-2">
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
