import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma-client";
import { formatReadingTime } from "@/lib/reading-time";

export const runtime = "nodejs";

/**
 * Cache generated OG cards for 24h.
 *
 * Without this the route is uncached, so every social scraper and crawler fetch
 * ran a live Prisma query and woke the Neon compute (which only scales to zero
 * after 5 idle minutes). Social platforms cache OG images for days regardless,
 * so a 24h window costs effectively nothing in freshness.
 */
export const revalidate = 86400;

const size = { width: 1200, height: 630 };

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fall back to the generic card on a DB failure rather than throwing — an OG
  // image is decorative, and a DB blip should not surface as a broken preview.
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: { title: true, excerpt: true, tags: true, readTime: true },
    });
  } catch (error) {
    console.error(`Failed to fetch post "${slug}" for OG image:`, error);
  }

  if (!post) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#94a3b8",
          fontSize: 36,
          fontFamily: "sans-serif",
        }}
      >
        Post Not Found
      </div>,
      { ...size }
    );
  }

  const tags = (post.tags ?? []).slice(0, 4);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        backgroundColor: "#0f172a",
        fontFamily: "sans-serif",
      }}
    >
      {/* Label + read time */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#3b82f6",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            display: "flex",
          }}
        >
          Blog
        </div>
        {post.readTime && (
          <>
            <div style={{ color: "#475569", display: "flex" }}>·</div>
            <div
              style={{
                fontSize: 16,
                color: "#64748b",
                display: "flex",
              }}
            >
              {formatReadingTime(post.readTime)}
            </div>
          </>
        )}
      </div>

      {/* Post title */}
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: "#f8fafc",
          lineHeight: 1.2,
          letterSpacing: "-0.025em",
          display: "flex",
          maxWidth: "90%",
        }}
      >
        {post.title.length > 70 ? post.title.slice(0, 67) + "..." : post.title}
      </div>

      {/* Excerpt */}
      {post.excerpt && (
        <div
          style={{
            fontSize: 22,
            color: "#94a3b8",
            marginTop: 20,
            lineHeight: 1.5,
            display: "flex",
            maxWidth: "85%",
          }}
        >
          {post.excerpt.length > 130 ? post.excerpt.slice(0, 127) + "..." : post.excerpt}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 32,
            flexWrap: "wrap",
          }}
        >
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: 14,
                color: "#cbd5e1",
                backgroundColor: "#1e293b",
                padding: "6px 16px",
                borderRadius: 9999,
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 80,
          fontSize: 16,
          color: "#475569",
          display: "flex",
          gap: 8,
        }}
      >
        <span>Yuta Asakura</span>
        <span>·</span>
        <span>asakurayuta.dev</span>
      </div>
    </div>,
    { ...size }
  );
}
