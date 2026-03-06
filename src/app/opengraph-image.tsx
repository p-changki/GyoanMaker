import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GyoanMaker - AI 영어 교안 자동 생성";
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
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f8f9ff 100%)",
        fontFamily: "sans-serif",
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
          fontSize: "56px",
          fontWeight: 800,
          color: "#1e293b",
          textAlign: "center",
          lineHeight: 1.3,
          marginBottom: "20px",
        }}
      >
        영어 지문 분석부터
        <br />
        <span style={{ color: "#2563eb" }}>교안 출력까지, 한 번에</span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "24px",
          color: "#64748b",
          textAlign: "center",
        }}
      >
        AI가 문장 분석 · 핵심 어휘 · 요약을 자동 생성합니다
      </div>
    </div>,
    { ...size }
  );
}
