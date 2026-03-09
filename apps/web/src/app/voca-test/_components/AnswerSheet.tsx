"use client";

import type { CSSProperties } from "react";
import type { TestConfig, VocaTestQuestion } from "../_hooks/vocaTest.types";

interface AnswerSheetProps {
  config: TestConfig;
  questions: VocaTestQuestion[];
}

const pageStyle: CSSProperties = {
  width: "794px",
  minHeight: "1123px",
  padding: "40px 50px",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily:
    '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
};

function TestHeader({ config }: { config: TestConfig }) {
  return (
    <header style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 4px 10px",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: 800,
            lineHeight: 1.1,
            minWidth: "80px",
            letterSpacing: "-0.5px",
          }}
        >
          {config.testCode || "VT1"}
        </div>
        <div style={{ flex: 1, textAlign: "center", lineHeight: 1.4 }}>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            {config.rangeDescription || "범위를 입력하세요"}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 800, marginTop: "2px" }}>
            {config.schoolName ? `${config.schoolName} ` : ""}
            {config.testTitle || "VOCA TEST"}
          </div>
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            textAlign: "right",
            minWidth: "80px",
          }}
        >
          {config.teacherName || ""}
        </div>
      </div>
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%)",
          borderRadius: "2px",
        }}
      />
    </header>
  );
}

export default function AnswerSheet({ config, questions }: AnswerSheetProps) {
  return (
    <div data-pdf-part="answer-key" data-pdf-order={999} style={pageStyle}>
      <TestHeader config={config} />

      <p style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 700 }}>정답 및 해설</p>

      <div style={{ columnCount: 2, columnGap: "40px" }}>
        {questions.map((question, index) => (
          <p
            key={question.id}
            style={{
              margin: "0 0 6px",
              fontSize: "14px",
              lineHeight: 1.6,
              breakInside: "avoid",
            }}
          >
            {index + 1}. {question.correctNumbers.join(", ")}
          </p>
        ))}
      </div>
    </div>
  );
}
