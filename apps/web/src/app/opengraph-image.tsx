import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GyoanMaker - AI-Powered English Handout Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // Dynamic TTF font loading to prevent rendering errors
  const fontData = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/packages/pretendard/dist/public/static/alternative/Pretendard-ExtraBold.ttf"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f8f9ff 100%)",
        fontFamily: '"Pretendard"',
      }}
    >
      {/* Logo area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            background: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "36px",
            fontWeight: 800,
          }}
        >
          G
        </div>
        <span
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#1e293b",
          }}
        >
          GyoanMaker
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: "56px",
          fontWeight: 800,
          color: "#1e293b",
          textAlign: "center",
          lineHeight: 1.3,
          marginBottom: "20px",
        }}
      >
        <span>From passage analysis</span>
        <span style={{ color: "#2563eb", marginTop: "12px" }}>
          to handout export, all in one
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "24px",
          color: "#64748b",
          textAlign: "center",
        }}
      >
        AI auto-generates sentence analysis, core vocabulary, and summaries
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 800,
        },
      ],
    }
  );
}
