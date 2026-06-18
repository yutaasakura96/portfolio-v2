import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Yuta Asakura — Cloud-Native Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        fontFamily: "sans-serif",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          width: 64,
          height: 4,
          backgroundColor: "#3b82f6",
          borderRadius: 2,
          marginBottom: 32,
          display: "flex",
        }}
      />

      {/* Name */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: "#f8fafc",
          letterSpacing: "-0.025em",
          display: "flex",
        }}
      >
        Yuta Asakura
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 28,
          color: "#94a3b8",
          marginTop: 16,
          display: "flex",
        }}
      >
        Cloud-Native Software Engineer
      </div>

      {/* Tech stack */}
      <div
        style={{
          fontSize: 18,
          color: "#64748b",
          marginTop: 24,
          display: "flex",
          gap: 12,
        }}
      >
        <span>AWS</span>
        <span>·</span>
        <span>Azure</span>
      </div>

      {/* Domain */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 16,
          color: "#475569",
          display: "flex",
        }}
      >
        asakurayuta.dev
      </div>
    </div>,
    { ...size }
  );
}
