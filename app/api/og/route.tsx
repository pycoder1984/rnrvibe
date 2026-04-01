import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTitle = searchParams.get("title") || "RnR Vibe";
  const title = rawTitle.slice(0, 100).replace(/[<>]/g, "");
  const rawType = searchParams.get("type") || "article";
  const type = ["blog", "guide", "article"].includes(rawType) ? rawType : "article";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* Purple glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 20px",
            borderRadius: 999,
            border: "1px solid rgba(168,85,247,0.3)",
            backgroundColor: "rgba(168,85,247,0.1)",
            marginBottom: 30,
            fontSize: 16,
            color: "#c084fc",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {type === "blog" ? "Blog" : type === "guide" ? "Guide" : "RnR Vibe"}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 48 : 56,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
            letterSpacing: -1,
            padding: "0 40px",
          }}
        >
          {title}
        </div>

        {/* Bottom brand */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          <span style={{ color: "#a855f7" }}>RnR</span>
          <span style={{ color: "#ffffff" }}>Vibe</span>
          <span style={{ color: "#737373", fontSize: 16, marginLeft: 12 }}>
            rnrvibe.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
