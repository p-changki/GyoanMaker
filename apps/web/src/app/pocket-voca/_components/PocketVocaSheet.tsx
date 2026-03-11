"use client";

import type { CSSProperties } from "react";
import type { PocketVocaData, PocketVocaConfig, PocketVocaWord } from "@gyoanmaker/shared/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_FIRST_PAGE = 11;  // first page: header + section label takes space
const ROWS_PER_PAGE = 12;       // subsequent pages: header only

const POS_KO: Record<string, string> = {
  "n.": "명",
  "v.": "동",
  "adj.": "형",
  "adv.": "부",
  "prep.": "전",
  "conj.": "접",
  "pron.": "대",
  "interj.": "감",
};

function toKoPos(pos: string): string {
  return POS_KO[pos.toLowerCase()] ?? pos;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatItem {
  passageLabel: string;
  isFirstInPassage: boolean;
  item: PocketVocaWord;
  globalNo: number;
}

interface PageData {
  items: FlatItem[];
  isFirstPage: boolean;
  pageNumber: number;
}

// ─── Page splitting ───────────────────────────────────────────────────────────

function buildFlatItems(data: PocketVocaData): FlatItem[] {
  let globalNo = 1;
  const flat: FlatItem[] = [];

  for (const passage of data.passages) {
    const passageLabel = passage.passageLabel || passage.passageId;
    passage.items.forEach((item, idx) => {
      flat.push({
        passageLabel,
        isFirstInPassage: idx === 0,
        item,
        globalNo: globalNo++,
      });
    });
  }
  return flat;
}

function splitIntoPages(flat: FlatItem[]): PageData[] {
  const pages: PageData[] = [];
  let remaining = [...flat];
  let pageIdx = 0;

  while (remaining.length > 0) {
    const isFirst = pageIdx === 0;
    const limit = isFirst ? ROWS_PER_FIRST_PAGE : ROWS_PER_PAGE;
    pages.push({
      items: remaining.slice(0, limit),
      isFirstPage: isFirst,
      pageNumber: pageIdx + 1,
    });
    remaining = remaining.slice(limit);
    pageIdx++;
  }

  return pages;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  width: "794px",
  height: "1123px",
  padding: "40px 50px",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  overflow: "hidden",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PocketVocaSheetProps {
  data: PocketVocaData;
  config: PocketVocaConfig;
}

function SheetHeader({ config }: { config: PocketVocaConfig }) {
  return (
    <header style={{ marginBottom: "16px", flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: "36px", marginLeft: "40px" }}>
          <div
            style={{
              fontSize: "44px",
              fontWeight: 900,
              lineHeight: 0.8,
              fontFamily: '"Arial Black", "Impact", sans-serif',
            }}
          >
            {config.sheetCode || "VOCA"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBottom: "2px" }}>
            {config.rangeDescription && (
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{config.rangeDescription}</div>
            )}
            <div style={{ fontSize: "17px", fontWeight: 900 }}>{config.sheetTitle || "포켓보카"}</div>
          </div>
        </div>
        {config.teacherName && (
          <div style={{ fontSize: "13px", fontWeight: 800, paddingBottom: "2px" }}>
            {config.teacherName}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ width: "180px", height: "12px", backgroundColor: "#b5c4f5" }} />
        <div style={{ flex: 1, height: "1px", backgroundColor: "#111827" }} />
      </div>
    </header>
  );
}

function SynAntCell({ items }: { items: { word: string; meaningKo: string }[] }) {
  return (
    <td
      style={{
        border: "1px solid #e5e7eb",
        padding: "6px 8px",
        verticalAlign: "top",
        fontSize: "11px",
        lineHeight: 1.65,
      }}
    >
      {items.map((it, i) => (
        <span key={i}>
          {it.word}
          <span style={{ color: "#6b7280" }}>({it.meaningKo})</span>
          {i < items.length - 1 && <span style={{ color: "#d1d5db" }}>,  </span>}
        </span>
      ))}
    </td>
  );
}

function VocaTable({ items }: { items: FlatItem[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
      <thead>
        <tr style={{ backgroundColor: "#f3f4f6" }}>
          <th style={{ border: "1px solid #e5e7eb", padding: "7px 8px", fontWeight: 800, width: "56px", textAlign: "center", fontSize: "11px" }}>No</th>
          <th style={{ border: "1px solid #e5e7eb", padding: "7px 8px", fontWeight: 800, width: "110px", textAlign: "left", fontSize: "11px" }}>단어</th>
          <th style={{ border: "1px solid #e5e7eb", padding: "7px 8px", fontWeight: 800, width: "90px", textAlign: "left", fontSize: "11px" }}>뜻</th>
          <th style={{ border: "1px solid #e5e7eb", padding: "7px 8px", fontWeight: 800, textAlign: "left", fontSize: "11px" }}>유의어</th>
          <th style={{ border: "1px solid #e5e7eb", padding: "7px 8px", fontWeight: 800, textAlign: "left", fontSize: "11px" }}>반의어</th>
        </tr>
      </thead>
      <tbody>
        {items.map(({ passageLabel, isFirstInPassage, item, globalNo }) => (
            <tr key={`${passageLabel}-${item.word}-${globalNo}`} style={{ backgroundColor: globalNo % 2 === 0 ? "#f9fafb" : "#ffffff" }}>
              <td
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "4px 4px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                {isFirstInPassage && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "7px",
                      fontWeight: 800,
                      color: "#5e35b1",
                      backgroundColor: "#ede7f6",
                      borderRadius: "2px",
                      padding: "1px 3px",
                      marginBottom: "1px",
                      lineHeight: 1.3,
                    }}
                  >
                    {passageLabel}
                  </span>
                )}
                <div style={{ fontSize: "11px", fontWeight: 400, color: "#9ca3af" }}>
                  {globalNo}
                </div>
              </td>
              <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px", fontWeight: 700, verticalAlign: "middle" }}>
                {item.word}
                <span
                  style={{
                    marginLeft: "4px",
                    fontSize: "9px",
                    fontWeight: 700,
                    backgroundColor: "#ede7f6",
                    color: "#5e35b1",
                    borderRadius: "3px",
                    padding: "1px 3px",
                  }}
                >
                  [{toKoPos(item.partOfSpeech)}]
                </span>
              </td>
              <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px", color: "#374151", verticalAlign: "middle", fontSize: "12px" }}>
                {item.meaningKo}
              </td>
              <SynAntCell items={item.synonyms} />
              <SynAntCell items={item.antonyms} />
            </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PocketVocaSheet({ data, config }: PocketVocaSheetProps) {
  const flat = buildFlatItems(data);
  const pages = splitIntoPages(flat);

  return (
    <>
      {pages.map((page, idx) => {
        const isLastPage = idx === pages.length - 1;
        const style: CSSProperties = isLastPage
          ? { ...pageStyle, height: "auto" }
          : pageStyle;

        return (
        <div
          key={page.pageNumber}
          data-pdf-part={`pocket-voca-${page.pageNumber}`}
          data-pdf-order={page.pageNumber}
          style={style}
        >
          <SheetHeader config={config} />

          {/* Section label — first page only */}
          {page.isFirstPage && (
            <div style={{ marginBottom: "12px", flexShrink: 0 }}>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  padding: "5px 18px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {config.sectionLabel || "포켓보카"}
              </span>
            </div>
          )}

          <div style={{ flex: 1, overflow: "hidden" }}>
            <VocaTable items={page.items} />
          </div>

          {/* Footer */}
          <footer style={{ marginTop: "auto", paddingTop: "10px", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#e5e7eb" }}>
              {page.pageNumber}
            </span>
          </footer>
        </div>
        );
      })}
    </>
  );
}
