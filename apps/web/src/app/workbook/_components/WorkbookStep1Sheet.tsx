"use client";

import type { CSSProperties } from "react";
import type { WorkbookConfig } from "@gyoanmaker/shared/types";

interface WorkbookStep1SheetProps {
  config: WorkbookConfig;
  passageId: string;
  passageTitle: string;
  sentences: string[];
  pageIndex: number;
  pdfOrder: number;
}

const PURPLE = "#6B21A8";

const pageStyle: CSSProperties = {
  width: "794px",
  minHeight: "1123px",
  padding: "40px 50px",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
};

function Header({ config }: { config: WorkbookConfig }) {
  return (
    <header style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              border: `2px solid ${PURPLE}`,
              color: PURPLE,
              fontWeight: 800,
              fontSize: "22px",
              lineHeight: 1,
              padding: "10px 14px",
            }}
          >
            {config.testCode || "01"}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "30px", fontWeight: 900, color: PURPLE }}>
              {config.testTitle || "Upgrade"}
            </p>
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${PURPLE}`,
            color: PURPLE,
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "999px",
            maxWidth: "300px",
            textAlign: "center",
          }}
        >
          {config.rangeDescription || "범위를 입력하세요"}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `3px solid ${PURPLE}`,
          paddingTop: "10px",
        }}
      >
        <span
          style={{
            backgroundColor: PURPLE,
            color: "#fff",
            fontWeight: 700,
            fontSize: "12px",
            borderRadius: "999px",
            padding: "4px 10px",
          }}
        >
          Workbook
        </span>
        <span style={{ color: PURPLE, fontWeight: 700, fontSize: "14px" }}>
          STEP 1 스스로 분석
        </span>
      </div>
    </header>
  );
}

export default function WorkbookStep1Sheet({
  config,
  passageId,
  passageTitle,
  sentences,
  pageIndex,
  pdfOrder,
}: WorkbookStep1SheetProps) {
  return (
    <section
      data-pdf-part={`workbook-step1-${pageIndex}`}
      data-pdf-order={pdfOrder}
      style={pageStyle}
    >
      <Header config={config} />

      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#4B5563" }}>
        스스로 분석 &gt; 핵심 내용 파악 &gt; 출제 예상 포인트 정리
      </p>

      <div
        style={{
          marginBottom: "16px",
          borderLeft: `4px solid ${PURPLE}`,
          paddingLeft: "10px",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", fontWeight: 700 }}>
          {passageId}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "17px", fontWeight: 800, color: "#111827" }}>
          {passageTitle || passageId}
        </p>
      </div>

      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {sentences.map((sentence, sentenceIndex) => (
          <li key={`${passageId}-${sentenceIndex}`} style={{ marginBottom: "12px", lineHeight: 1.7 }}>
            <span style={{ color: PURPLE, fontWeight: 800, marginRight: "6px" }}>
              {sentenceIndex + 1}.
            </span>
            <span style={{ fontSize: "14px" }}>{sentence}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
