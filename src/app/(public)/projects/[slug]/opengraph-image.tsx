import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prismaClient";

export const runtime = "nodejs";

export const alt = "Project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProjectOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, shortDescription: true, techTags: true },
  });

  if (!project) {
    return new ImageResponse(
      (
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
          Project Not Found
        </div>
      ),
      { ...size }
    );
  }

  const tags = (project.techTags ?? []).slice(0, 4);

  return new ImageResponse(
    (
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
        {/* Label */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#3b82f6",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 20,
            display: "flex",
          }}
        >
          Project
        </div>

        {/* Project title */}
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
          {project.title.length > 60
            ? project.title.slice(0, 57) + "..."
            : project.title}
        </div>

        {/* Description */}
        {project.shortDescription && (
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
            {project.shortDescription.length > 120
              ? project.shortDescription.slice(0, 117) + "..."
              : project.shortDescription}
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
      </div>
    ),
    { ...size }
  );
}
