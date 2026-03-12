"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useLectureSlideStore, type SlideConfig } from "../_hooks/useLectureSlideStore";
import { usePptxExport } from "../_hooks/usePptxExport";
import { buildSlides, type SlideData } from "../_lib/buildSlides";


// ─── Virtual canvas = PPT LAYOUT_WIDE (13.33" × 7.5" → 960×540px) ───────────
const VW = 960;
const VH = 540;
const IPX = 72;         // 960px / 13.33in ≈ 72px/in for LAYOUT_WIDE
const PTPX = IPX / 72;  // 1 pt → px (= 1.0)

// PPT layout constants — kept in sync with usePptxExport.ts
const TITLE_X  = 0.4  * IPX;
const TITLE_Y  = 0.12 * IPX;
const BODY_X   = 0.4  * IPX;
const BADGE_W  = 1.4  * IPX;
const BADGE_H  = 0.42 * IPX;
const BADGE_R  = 0.1  * IPX;
const CONTENT_W = 12.5 * IPX;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Badge({
  y, label, badgeBg, badgeText, font,
}: {
  y: number; label: string; badgeBg: string; badgeText: string; font: string;
}) {
  return (
    <>
      <div style={{
        position: "absolute", left: BODY_X, top: y,
        width: BADGE_W, height: BADGE_H,
        backgroundColor: badgeBg, borderRadius: BADGE_R,
      }} />
      <div style={{
        position: "absolute", left: BODY_X, top: y,
        width: BADGE_W, height: BADGE_H,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18 * PTPX, fontWeight: "bold",
        color: badgeText, fontFamily: font,
      }}>
        {label}
      </div>
    </>
  );
}

// ─── Slide content renderers ──────────────────────────────────────────────────

function TopicSummaryContent({ slide, config }: { slide: SlideData; config: SlideConfig }) {
  const { theme, fonts, bodyFontSize } = config;
  const bodyColor  = `#${theme.bodyText}`;
  const badgeBg    = `#${theme.badgeBg}`;
  const badgeText  = `#${theme.badgeText}`;

  const els: React.ReactNode[] = [];
  let curY = 0.8 * IPX;

  // 주제 badge
  els.push(<Badge key="b1" y={curY} label="주제" badgeBg={badgeBg} badgeText={badgeText} font={fonts.badgeFont} />);
  curY += BADGE_H + 0.15 * IPX;

  if (slide.topicEn) {
    const h = 0.55 * IPX;
    els.push(
      <div key="ten" style={{
        position: "absolute", left: BODY_X, top: curY,
        width: CONTENT_W, height: h,
        fontSize: (bodyFontSize + 2) * PTPX, fontWeight: "bold",
        color: bodyColor, fontFamily: fonts.topicEnFont,
        overflow: "hidden", lineHeight: 1.3,
      }}>
        {slide.topicEn}
      </div>
    );
    curY += 0.6 * IPX;
  }

  if (slide.topicKo) {
    const h = 0.45 * IPX;
    els.push(
      <div key="tko" style={{
        position: "absolute", left: BODY_X, top: curY,
        width: CONTENT_W, height: h,
        fontSize: (bodyFontSize - 1) * PTPX,
        color: bodyColor, fontFamily: fonts.topicKoFont,
        overflow: "hidden", lineHeight: 1.3, opacity: 0.85,
      }}>
        {slide.topicKo}
      </div>
    );
    curY += 0.55 * IPX;
  }

  // 요약 badge
  els.push(<Badge key="b2" y={curY} label="요약" badgeBg={badgeBg} badgeText={badgeText} font={fonts.badgeFont} />);
  curY += BADGE_H + 0.15 * IPX;

  (slide.summaryLines ?? []).forEach((line, i) => {
    if (line.en) {
      els.push(
        <div key={`se${i}`} style={{
          position: "absolute", left: BODY_X, top: curY,
          width: CONTENT_W, height: 0.38 * IPX,
          fontSize: (bodyFontSize - 1) * PTPX,
          color: bodyColor, fontFamily: fonts.topicEnFont,
          overflow: "hidden", lineHeight: 1.3,
        }}>
          {line.en}
        </div>
      );
      curY += 0.42 * IPX;
    }
    if (line.ko) {
      els.push(
        <div key={`sk${i}`} style={{
          position: "absolute", left: BODY_X, top: curY,
          width: CONTENT_W, height: 0.38 * IPX,
          fontSize: (bodyFontSize - 2) * PTPX,
          color: bodyColor, fontFamily: fonts.topicKoFont,
          overflow: "hidden", lineHeight: 1.3, opacity: 0.8,
        }}>
          {line.ko}
        </div>
      );
      curY += 0.45 * IPX;
    }
  });

  return <>{els}</>;
}

function SentencesContent({ slide, config }: { slide: SlideData; config: SlideConfig }) {
  const { theme, fonts, bodyFontSize } = config;
  const bodyColor = `#${theme.bodyText}`;

  const NUM_W = 0.5 * IPX;
  const TEXT_W = CONTENT_W - NUM_W;
  const EN_KO_GAP = 0.05 * IPX;
  const ITEM_GAP  = 0.13 * IPX;

  return (
    <div style={{
      position: "absolute", left: BODY_X, top: 0.9 * IPX,
      width: CONTENT_W,
    }}>
      {(slide.sentenceItems ?? []).map((item) => (
        <div key={item.index} style={{ marginBottom: ITEM_GAP }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{
              flexShrink: 0, width: NUM_W,
              fontSize: bodyFontSize * PTPX,
              color: bodyColor, fontFamily: fonts.sentenceEnFont, lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}>
              {item.index}.
            </div>
            <div style={{
              flex: 1, width: TEXT_W,
              fontSize: bodyFontSize * PTPX,
              color: bodyColor, fontFamily: fonts.sentenceEnFont, lineHeight: 1.4,
            }}>
              {item.en}
            </div>
          </div>
          {slide.showKorean && item.ko && (
            <div style={{
              marginTop: EN_KO_GAP, marginLeft: NUM_W,
              width: TEXT_W,
              fontSize: (bodyFontSize - 2) * PTPX,
              color: bodyColor, fontFamily: fonts.sentenceKoFont, lineHeight: 1.3, opacity: 0.8,
            }}>
              {item.ko}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VocabContent({ slide, config }: { slide: SlideData; config: SlideConfig }) {
  const { theme, fonts } = config;
  const bodyColor  = `#${theme.bodyText}`;
  const badgeBg    = `#${theme.badgeBg}`;
  const badgeText  = `#${theme.badgeText}`;
  const bgColor    = `#${theme.bg}`;

  const colW = [0.7, 1.9, 2.2, 3.85, 3.85].map((w) => w * IPX); // total 12.5" for LAYOUT_WIDE
  const rowH = 0.38 * IPX;
  const tableY = 0.85 * IPX;

  const rows = [
    ["No", "단어", "뜻", "유의어", "반의어"],
    ...(slide.vocabItems ?? []).map((v) => [
      String(v.index), v.word, v.meaning, v.synonyms || "-", v.antonyms || "-",
    ]),
  ];

  return (
    <>
      {rows.map((row, rIdx) => {
        let cellX = BODY_X;
        return row.map((cell, cIdx) => {
          const x = cellX;
          cellX += colW[cIdx];
          return (
            <div key={`${rIdx}-${cIdx}`} style={{
              position: "absolute",
              left: x, top: tableY + rIdx * rowH,
              width: colW[cIdx], height: rowH,
              backgroundColor: rIdx === 0 ? badgeBg : bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: cIdx === 0 ? "center" : "flex-start",
              paddingLeft: cIdx === 0 ? 0 : 4,
              fontSize: (rIdx === 0 ? 12 : 11) * PTPX,
              fontWeight: rIdx === 0 ? "bold" : "normal",
              color: rIdx === 0 ? badgeText : bodyColor,
              fontFamily: fonts.vocabFont,
              borderBottom: `1px solid ${bodyColor}33`,
              borderRight: cIdx < 4 ? `1px solid ${bodyColor}33` : "none",
              boxSizing: "border-box",
              overflow: "hidden",
            }}>
              <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "100%" }}>
                {cell}
              </span>
            </div>
          );
        });
      })}
    </>
  );
}

// ─── SlideCard — renders at VW×VH then CSS-scales to container ────────────────

function SlideCard({ slide, config }: { slide: SlideData; config: SlideConfig }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / VW);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { theme, fonts, titleFontSize } = config;

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-lg border border-gray-700 shadow-md"
      style={{ aspectRatio: "16/9" }}
    >
      {/* Virtual 960×540 canvas, scaled down to fit */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: VW, height: VH,
        transformOrigin: "top left",
        transform: `scale(${scale})`,
        backgroundColor: `#${theme.bg}`,
      }}>
        {/* Passage title */}
        <div style={{
          position: "absolute",
          left: TITLE_X, top: TITLE_Y,
          width: 10 * IPX, height: 0.5 * IPX,
          fontSize: titleFontSize * PTPX,
          fontWeight: "bold",
          color: `#${theme.titleColor}`,
          fontFamily: fonts.badgeFont,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}>
          {slide.passageTitle}
        </div>

        {slide.type === "topic-summary" && <TopicSummaryContent slide={slide} config={config} />}
        {slide.type === "sentences"     && <SentencesContent    slide={slide} config={config} />}
        {slide.type === "vocab"         && <VocabContent        slide={slide} config={config} />}
      </div>
    </div>
  );
}

// ─── SlidePreview ─────────────────────────────────────────────────────────────

export default function SlidePreview() {
  const sections             = useLectureSlideStore((s) => s.sections);
  const config               = useLectureSlideStore((s) => s.config);
  const selectedHandoutTitle = useLectureSlideStore((s) => s.selectedHandoutTitle);
  const setStep              = useLectureSlideStore((s) => s.setStep);
  const { exportPptx, isExporting } = usePptxExport();
  const [showModal, setShowModal] = useState(false);

  const slides = useMemo(
    () => buildSlides(sections, config, selectedHandoutTitle),
    [sections, config, selectedHandoutTitle]
  );

  const handleExport = () => {
    setShowModal(false);
    const fileName = selectedHandoutTitle
      ? `${selectedHandoutTitle}_강의슬라이드`
      : "강의슬라이드";
    exportPptx(sections, config, selectedHandoutTitle, fileName);
  };

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-gray-500">Step 3</p>
          <h2 className="text-2xl font-bold text-gray-900">미리보기</h2>
          <p className="text-sm text-gray-500">
            총 {slides.length}장 · {selectedHandoutTitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={isExporting || slides.length === 0}
          className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isExporting ? "생성 중..." : "PPT 다운로드"}
        </button>
      </header>

      {/* Download confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">PPT 다운로드</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              디테일한 수정은 PPT를 내려받은 후<br />
              파워포인트에서 직접 편집할 수 있습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {slides.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          슬라이드 구성을 1개 이상 선택해 주세요.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {slides.map((slide, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[11px] text-gray-400">
              {i + 1} /{" "}
              {slide.type === "topic-summary"
                ? "주제·요약"
                : slide.type === "sentences"
                ? "문장"
                : "어휘"}
            </p>
            <SlideCard slide={slide} config={config} />
          </div>
        ))}
      </div>

      <div className="flex justify-start pt-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← 설정으로
        </button>
      </div>
    </section>
  );
}
