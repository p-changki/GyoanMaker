"use client";

import type { CSSProperties } from "react";
import type { WorkbookConfig, WorkbookData } from "@gyoanmaker/shared/types";

interface WorkbookAnswerSheetProps {
  config: WorkbookConfig;
  passages: WorkbookData["passages"];
  pdfOrder: number;
}

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];
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
          <p style={{ margin: 0, fontSize: "30px", fontWeight: 900, color: PURPLE }}>
            {config.testTitle || "Upgrade"}
          </p>
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
      <div style={{ borderTop: `3px solid ${PURPLE}`, paddingTop: "10px" }}>
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
          정답지
        </span>
      </div>
    </header>
  );
}

export default function WorkbookAnswerSheet({
  config,
  passages,
  pdfOrder,
}: WorkbookAnswerSheetProps) {
  const step2Answers = passages.flatMap((passage) =>
    passage.step2Items.map((item) => ({
      questionNumber: item.questionNumber,
      text: item.answerKey.join(" / "),
    }))
  );

  const step3Answers = passages.flatMap((passage) =>
    passage.step3Items.map((item) => ({
      questionNumber: item.questionNumber,
      text: CIRCLE_NUMBERS[item.answerIndex] ?? CIRCLE_NUMBERS[0],
    }))
  );

  return (
    <section data-pdf-part="workbook-answer" data-pdf-order={pdfOrder} style={pageStyle}>
      <Header config={config} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <section>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: PURPLE, fontWeight: 800 }}>
            STEP 2
          </h3>
          {step2Answers.map((answer) => (
            <p key={`step2-${answer.questionNumber}`} style={{ margin: "0 0 6px", fontSize: "13px", lineHeight: 1.5 }}>
              {answer.questionNumber}) {answer.text}
            </p>
          ))}
        </section>

        <section>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: PURPLE, fontWeight: 800 }}>
            STEP 3
          </h3>
          {step3Answers.map((answer) => (
            <p key={`step3-${answer.questionNumber}`} style={{ margin: "0 0 6px", fontSize: "13px", lineHeight: 1.5 }}>
              {answer.questionNumber}) {answer.text}
            </p>
          ))}
        </section>
      </div>
    </section>
  );
}
