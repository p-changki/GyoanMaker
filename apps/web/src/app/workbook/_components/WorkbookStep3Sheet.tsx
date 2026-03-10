"use client";

import type { CSSProperties } from "react";
import type { WorkbookConfig, WorkbookStep3Item } from "@gyoanmaker/shared/types";
import { EditableText } from "@/components/compile/EditableText";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

interface WorkbookStep3SheetProps {
  config: WorkbookConfig;
  passageId: string;
  passageTitle: string;
  items: WorkbookStep3Item[];
  pageIndex: number;
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
          STEP 3 순서
        </span>
      </div>
    </header>
  );
}

export default function WorkbookStep3Sheet({
  config,
  passageId,
  passageTitle,
  items,
  pageIndex,
  pdfOrder,
}: WorkbookStep3SheetProps) {
  const updateStep3Item = useWorkbookStore((state) => state.updateStep3Item);

  return (
    <section
      data-pdf-part={`workbook-step3-${pageIndex}`}
      data-pdf-order={pdfOrder}
      style={pageStyle}
    >
      <Header config={config} />

      <div
        style={{
          marginBottom: "14px",
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
        {items.map((item) => (
          <li key={`${passageId}-${item.questionNumber}`} style={{ marginBottom: "24px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: PURPLE }}>
              {String(item.questionNumber).padStart(2, "0")}. {item.passageNumber}
              {")"}
            </p>

            <EditableText
              value={item.intro}
              label="STEP 3 Intro"
              multiline
              maxLength={2000}
              as="p"
              className="text-[14px] leading-7"
              style={{ margin: "0 0 8px" }}
              onConfirm={(next) =>
                updateStep3Item(passageId, item.questionNumber, (prev) => ({
                  ...prev,
                  intro: next,
                }))
              }
            />

            <div style={{ marginBottom: "8px" }}>
              {item.paragraphs.map((paragraph, paragraphIndex) => (
                <EditableText
                  key={`${item.questionNumber}-${paragraph.label}`}
                  value={`(${paragraph.label}) ${paragraph.text}`}
                  label={`Paragraph ${paragraph.label}`}
                  multiline
                  maxLength={3000}
                  as="p"
                  className="text-[14px] leading-7"
                  style={{ margin: "0 0 2px" }}
                  onConfirm={(next) =>
                    updateStep3Item(passageId, item.questionNumber, (prev) => ({
                      ...prev,
                      paragraphs: prev.paragraphs.map((p, idx) =>
                        idx !== paragraphIndex
                          ? p
                          : {
                              ...p,
                              text: next.replace(/^\([A-D]\)\s*/, ""),
                            }
                      ),
                    }))
                  }
                />
              ))}
            </div>

            <p style={{ margin: "8px 0 6px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>
              선택지
            </p>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7 }}>
              {item.options.map((option, optionIndex) => (
                <span key={`${item.questionNumber}-option-${optionIndex}`} style={{ marginRight: "12px" }}>
                  {CIRCLE_NUMBERS[optionIndex]} ({option.join(")-(")})
                </span>
              ))}
            </p>

            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#4B5563", fontWeight: 700 }}>정답</span>
              <select
                value={item.answerIndex}
                onChange={(event) => {
                  const nextAnswerIndex = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(nextAnswerIndex)) return;
                  updateStep3Item(passageId, item.questionNumber, (prev) => ({
                    ...prev,
                    answerIndex: nextAnswerIndex,
                  }));
                }}
                style={{
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "4px 8px",
                  backgroundColor: "#fff",
                }}
              >
                {CIRCLE_NUMBERS.map((symbol, index) => (
                  <option key={`${item.questionNumber}-answer-${symbol}`} value={index}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
