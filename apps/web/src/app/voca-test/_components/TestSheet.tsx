"use client";

import type { CSSProperties } from "react";
import type {
  TestConfig,
  TestOption,
  VocaTestQuestion,
} from "../_hooks/vocaTest.types";

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];

interface TestSheetProps {
  config: TestConfig;
  questions: VocaTestQuestion[];
  pageIndex: number;
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

function renderOption(option: TestOption) {
  return (
    <p
      key={`${option.number}-${option.word}`}
      style={{ margin: "2px 0", fontSize: "14px", lineHeight: 1.5 }}
    >
      {CIRCLE_NUMBERS[option.number - 1] ?? `${option.number}.`} {option.word}
    </p>
  );
}

function TestHeader({ config }: { config: TestConfig }) {
  return (
    <header style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "36px",
            marginLeft: "40px",
          }}
        >
          <div
            style={{
              fontSize: "44px",
              fontWeight: 900,
              lineHeight: 0.8,
              fontFamily: '"Arial Black", "Impact", sans-serif',
            }}
          >
            {config.testCode || "VT1"}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingBottom: "2px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
              }}
            >
              {config.rangeDescription || "범위를 입력하세요"}
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 900,
              }}
            >
              {config.schoolName ? `${config.schoolName} ` : ""}
              {config.testTitle || "VOCA TEST"}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            paddingBottom: "2px",
          }}
        >
          {config.teacherName || ""}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div
          style={{ width: "180px", height: "12px", backgroundColor: "#b5c4f5" }}
        />
        <div style={{ flex: 1, height: "1px", backgroundColor: "#111827" }} />
      </div>
    </header>
  );
}

export default function TestSheet({
  config,
  questions,
  pageIndex,
}: TestSheetProps) {
  const left = questions.slice(0, 5);
  const right = questions.slice(5, 10);
  const pageStart = pageIndex * 10;

  return (
    <div data-pdf-part="test-page" data-pdf-order={pageIndex} style={pageStyle}>
      <TestHeader config={config} />

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div>
          {pageIndex === 0 && (
            <div style={{ padding: "0 4px", marginBottom: "32px" }}>
              <div
                style={{
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                이름:
              </div>
              <div
                style={{ display: "flex", fontSize: "16px", fontWeight: 500 }}
              >
                <span style={{ width: "170px" }}>점수:</span>
                <span>(커트라인: {config.cutline || "-"})</span>
              </div>
            </div>
          )}
          {left.map((question, index) => (
            <div key={question.id} style={{ marginBottom: "22px" }}>
              <p
                style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.6 }}
              >
                {pageStart + index + 1}. 다음 중 {question.keyword}와 유의어
                관계인 것을 모두 고르시오. (2개)
              </p>
              {[...question.options]
                .sort((a, b) => a.number - b.number)
                .map(renderOption)}
            </div>
          ))}
        </div>

        <div>
          {right.map((question, index) => (
            <div key={question.id} style={{ marginBottom: "22px" }}>
              <p
                style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.6 }}
              >
                {pageStart + index + 6}. 다음 중 {question.keyword}와 유의어
                관계인 것을 모두 고르시오. (2개)
              </p>
              {[...question.options]
                .sort((a, b) => a.number - b.number)
                .map(renderOption)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
