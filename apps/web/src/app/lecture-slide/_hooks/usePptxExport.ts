"use client";

import { useState, useCallback } from "react";
import type { HandoutSection } from "@gyoanmaker/shared/types";
import type { SlideConfig } from "./useLectureSlideStore";
import { buildSlides } from "../_lib/buildSlides";

const SLIDE_W = 13.33; // inches — pptxgenjs LAYOUT_WIDE = 13.33" × 7.5"
const LOGO_TOP = 0.1;
const LOGO_RIGHT_MARGIN = 0.2;
const TITLE_X = 0.4;
const TITLE_Y = 0.12;
const BADGE_W = 1.4;
const BADGE_H = 0.42;
const BADGE_RADIUS = 0.1;
const BODY_X = 0.4;

function hexColor(hex: string) {
  return hex.replace("#", "");
}

/**
 * 텍스트가 pptxgenjs 텍스트 박스 내에서 몇 줄로 래핑될지 추정한다.
 * 한글은 em 2.0배, ASCII는 0.6배 너비로 계산 (pptxgenjs 실측 보정).
 * 1.05 safety margin을 곱해 줄수가 부족해지는 케이스를 방지한다.
 */
function estimateLines(text: string, widthIn: number, sizePt: number): number {
  const units = [...text].reduce(
    (sum, ch) => sum + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? 2.0 : 0.6),
    0
  );
  const unitsPerLine = (widthIn * 72) / sizePt;
  return Math.max(1, Math.ceil((units * 1.05) / unitsPerLine));
}

export function usePptxExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPptx = useCallback(
    async (
      sections: HandoutSection[],
      config: SlideConfig,
      handoutTitle: string,
      fileName: string
    ) => {
      setIsExporting(true);
      try {
        // Dynamic import to avoid SSR issues (~3MB bundle)
        const PptxGenJS = (await import("pptxgenjs")).default;
        const pptx = new PptxGenJS();
        pptx.layout = "LAYOUT_WIDE"; // 16:9

        const { theme, fonts, logoDataUrl, logoWidth, titleFontSize, bodyFontSize } = config;
        const bgHex = hexColor(theme.bg);
        const titleHex = hexColor(theme.titleColor);
        const badgeBgHex = hexColor(theme.badgeBg);
        const badgeTextHex = hexColor(theme.badgeText);
        const bodyHex = hexColor(theme.bodyText);

        const slides = buildSlides(sections, config, handoutTitle);
        const logoWidthIn = (logoWidth / 96) * 1.2; // px → inches approx

        slides.forEach((slideData) => {
          const slide = pptx.addSlide();
          slide.background = { color: bgHex };

          // ── Passage title (top-left) ───────────────────────────────────
          // Title uses badge font (most visible, decorative element)
          slide.addText(slideData.passageTitle, {
            x: TITLE_X,
            y: TITLE_Y,
            w: 10,
            h: 0.5,
            fontSize: titleFontSize,
            bold: true,
            color: titleHex,
            fontFace: fonts.badgeFont,
          });

          // ── Logo (top-right) ───────────────────────────────────────────
          if (logoDataUrl) {
            const logoH = logoWidthIn * 0.5; // aspect ratio 2:1 assumed
            slide.addImage({
              data: logoDataUrl,
              x: SLIDE_W - logoWidthIn - LOGO_RIGHT_MARGIN,
              y: LOGO_TOP,
              w: logoWidthIn,
              h: logoH,
            });
          }

          // ── Topic + Summary slide ──────────────────────────────────────
          if (slideData.type === "topic-summary") {
            let curY = 0.8;

            // 주제 badge
            slide.addShape(pptx.ShapeType.roundRect, {
              x: BODY_X,
              y: curY,
              w: BADGE_W,
              h: BADGE_H,
              fill: { color: badgeBgHex },
              line: { color: badgeBgHex },
              rectRadius: BADGE_RADIUS,
            });
            slide.addText("주제", {
              x: BODY_X,
              y: curY,
              w: BADGE_W,
              h: BADGE_H,
              align: "center",
              valign: "middle",
              fontSize: 18,
              bold: true,
              color: badgeTextHex,
              fontFace: fonts.badgeFont,
            });
            curY += BADGE_H + 0.15;

            // Topic EN
            if (slideData.topicEn) {
              slide.addText(slideData.topicEn, {
                x: BODY_X,
                y: curY,
                w: 12.5,
                h: 0.55,
                fontSize: bodyFontSize + 2,
                bold: true,
                color: bodyHex,
                fontFace: fonts.topicEnFont,
                autoFit: true,
              });
              curY += 0.6;
            }

            // Topic KO
            if (slideData.topicKo) {
              slide.addText(slideData.topicKo, {
                x: BODY_X,
                y: curY,
                w: 12.5,
                h: 0.45,
                fontSize: bodyFontSize - 1,
                color: bodyHex,
                fontFace: fonts.topicKoFont,
                autoFit: true,
              });
              curY += 0.55;
            }

            // 요약 badge
            slide.addShape(pptx.ShapeType.roundRect, {
              x: BODY_X,
              y: curY,
              w: BADGE_W,
              h: BADGE_H,
              fill: { color: badgeBgHex },
              line: { color: badgeBgHex },
              rectRadius: BADGE_RADIUS,
            });
            slide.addText("요약", {
              x: BODY_X,
              y: curY,
              w: BADGE_W,
              h: BADGE_H,
              align: "center",
              valign: "middle",
              fontSize: 18,
              bold: true,
              color: badgeTextHex,
              fontFace: fonts.badgeFont,
            });
            curY += BADGE_H + 0.15;

            // Summary lines
            const lines = slideData.summaryLines ?? [];
            lines.forEach((line) => {
              if (line.en) {
                slide.addText(line.en, {
                  x: BODY_X,
                  y: curY,
                  w: 12.5,
                  h: 0.38,
                  fontSize: bodyFontSize - 1,
                  color: bodyHex,
                  fontFace: fonts.topicEnFont,
                  autoFit: true,
                });
                curY += 0.42;
              }
              if (line.ko) {
                slide.addText(line.ko, {
                  x: BODY_X,
                  y: curY,
                  w: 12.5,
                  h: 0.38,
                  fontSize: bodyFontSize - 2,
                  color: bodyHex,
                  fontFace: fonts.topicKoFont,
                  autoFit: true,
                });
                curY += 0.45;
              }
            });
          }

          // ── Sentences slide ────────────────────────────────────────────
          if (slideData.type === "sentences") {
            const enSingleH = (bodyFontSize * 1.4) / 72;
            const koSingleH = ((bodyFontSize - 2) * 1.3) / 72;
            let curY = 0.9;

            const NUM_W = 0.5;
            const TEXT_X = BODY_X + NUM_W;
            const TEXT_W = 12.0;
            const ITEM_GAP = 0.15;
            // EN↔KO 간격 (pt): pptxgenjs paraSpaceBefore로 제어 → 추정 오차 무관
            const EN_KO_SPACE_PT = 4;

            (slideData.sentenceItems ?? []).forEach((item) => {
              const enLines = estimateLines(item.en, TEXT_W, bodyFontSize);
              const koLines =
                slideData.showKorean && item.ko
                  ? estimateLines(item.ko, TEXT_W, bodyFontSize - 2)
                  : 0;

              // EN + KO를 하나의 텍스트 박스로 합침 → 내부 간격은 PPT 네이티브 처리
              // \n으로 줄바꿈 강제 + paraSpaceBefore로 EN↔KO 간격 제어
              const textParts: Array<{
                text: string;
                options: Record<string, unknown>;
              }> = [
                {
                  text:
                    slideData.showKorean && item.ko
                      ? item.en + "\n"
                      : item.en,
                  options: {
                    fontSize: bodyFontSize,
                    color: bodyHex,
                    fontFace: fonts.sentenceEnFont,
                    lineSpacingMultiple: 1.4,
                    paraSpaceAfter: slideData.showKorean && item.ko ? EN_KO_SPACE_PT : 0,
                  },
                },
              ];

              if (slideData.showKorean && item.ko) {
                textParts.push({
                  text: item.ko,
                  options: {
                    fontSize: bodyFontSize - 2,
                    color: bodyHex,
                    fontFace: fonts.sentenceKoFont,
                    lineSpacingMultiple: 1.3,
                  },
                });
              }

              // 합산 높이 추정 (curY 이동용 — 박스 내부 간격은 PPT가 처리)
              const totalH =
                enSingleH * enLines +
                (koLines > 0
                  ? koSingleH * koLines + EN_KO_SPACE_PT / 72
                  : 0) +
                0.05; // 내부 패딩 여유

              // 번호 박스
              slide.addText(`${item.index}.`, {
                x: BODY_X,
                y: curY,
                w: NUM_W,
                h: enSingleH,
                fontSize: bodyFontSize,
                color: bodyHex,
                fontFace: fonts.sentenceEnFont,
                valign: "top",
                lineSpacingMultiple: 1.4,
              });
              // EN + KO 통합 텍스트 박스
              slide.addText(textParts, {
                x: TEXT_X,
                y: curY,
                w: TEXT_W,
                h: totalH,
                valign: "top",
              });
              curY += totalH + ITEM_GAP;
            });
          }

          // ── Vocab slide ────────────────────────────────────────────────
          if (slideData.type === "vocab") {
            const headers = ["No", "단어", "뜻", "유의어", "반의어"];
            const colW = [0.7, 1.9, 2.2, 3.85, 3.85]; // total 12.5" for LAYOUT_WIDE
            const rows: string[][] = [
              headers,
              ...(slideData.vocabItems ?? []).map((v) => [
                String(v.index),
                v.word,
                v.meaning,
                v.synonyms || "-",
                v.antonyms || "-",
              ]),
            ];

            slide.addTable(
              rows.map((row, rIdx) =>
                row.map((cell, cIdx) => ({
                  text: cell,
                  options: {
                    bold: rIdx === 0,
                    fontSize: rIdx === 0 ? 12 : 11,
                    color: rIdx === 0 ? badgeTextHex : bodyHex,
                    fill: { color: rIdx === 0 ? badgeBgHex : bgHex },
                    fontFace: fonts.vocabFont,
                    align: cIdx === 0 ? ("center" as const) : ("left" as const),
                    valign: "middle" as const,
                  },
                }))
              ),
              {
                x: BODY_X,
                y: 0.85,
                w: 12.5,
                colW,
                rowH: 0.38,
                border: { pt: 1, color: hexColor(theme.bodyText) + "44" },
              }
            );
          }
        });

        await pptx.writeFile({ fileName: `${fileName}.pptx` });
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportPptx, isExporting };
}
