"use client";

import type { WorkbookStep3Item } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { EditableText } from "@/components/compile/EditableText";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];

/** Flat step3 item with passageId attached for store updates */
export interface FlatStep3Item extends WorkbookStep3Item {
  passageId: string;
}

interface CompileStep3ContentProps {
  items: FlatStep3Item[];
  /** Global starting index (0-based) for continuous numbering */
  startIndex: number;
}

export default function CompileStep3Content({
  items,
  startIndex,
}: CompileStep3ContentProps) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const page1BodyStyle = useTemplateSettingsStore((s) => s.page1BodyStyle);

  const base = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...base, ...customColors } : base;
  const fontCss = page1BodyStyle?.fontFamily
    ? FONT_FAMILY_MAP[page1BodyStyle.fontFamily].css
    : FONT_FAMILY_MAP[fontFamily].css;

  // Match handout analysisEn: same pt unit, same line-height 2.1
  const bodyFontPt = fontSizes.analysisEn ?? 10;

  const updateStep3Item = useWorkbookStore((state) => state.updateStep3Item);

  return (
    <div style={{ fontFamily: fontCss }}>
      {/* Instruction (only on first page) */}
      {startIndex === 0 && (
        <p
          style={{
            fontSize: `${bodyFontPt + 1}pt`,
            color: "#6B7280",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          ▶ 주어진 글 다음에 이어질 글의 순서로 가장 적절한 것을 고르시오.
        </p>
      )}

      {/* Items with consistent spacing */}
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, idx) => (
          <li
            key={`s3-${startIndex + idx}`}
            style={{ marginBottom: "40px" }}
          >
            {/* Question number */}
            <div
              style={{
                fontSize: `${bodyFontPt + 1}pt`,
                fontWeight: 900,
                color: colors.primary,
                marginBottom: "8px",
              }}
            >
              {startIndex + idx + 1}.
            </div>

            {/* Intro (lead sentence) */}
            <EditableText
              value={item.intro}
              label="STEP 3 도입문 수정"
              multiline
              maxLength={2000}
              as="p"
              themeColor={colors.primary}
              style={{
                margin: "0 0 12px",
                fontSize: `${bodyFontPt}pt`,
                lineHeight: 2.1,
                textAlign: "justify",
                color: "#111827",
              }}
              onConfirm={(next) =>
                updateStep3Item(item.passageId, item.questionNumber, (prev) => ({
                  ...prev,
                  intro: next,
                }))
              }
            />

            {/* Paragraphs (A), (B), (C), (D) */}
            <div style={{ marginBottom: "10px" }}>
              {item.paragraphs.map((paragraph, paragraphIndex) => (
                <EditableText
                  key={`${startIndex + idx}-${paragraph.label}`}
                  value={`(${paragraph.label}) ${paragraph.text}`}
                  label={`블록 ${paragraph.label} 수정`}
                  multiline
                  maxLength={3000}
                  as="p"
                  themeColor={colors.primary}
                  style={{
                    margin: "0 0 6px",
                    fontSize: `${bodyFontPt}pt`,
                    lineHeight: 2.1,
                    textAlign: "justify",
                    textIndent: "-1.6em",
                    paddingLeft: "1.6em",
                    color: "#111827",
                  }}
                  onConfirm={(next) =>
                    updateStep3Item(item.passageId, item.questionNumber, (prev) => ({
                      ...prev,
                      paragraphs: prev.paragraphs.map((p, i) =>
                        i !== paragraphIndex
                          ? p
                          : { ...p, text: next.replace(/^\([A-D]\)\s*/, "") }
                      ),
                    }))
                  }
                />
              ))}
            </div>

            {/* Options ①~⑤ */}
            <p
              style={{
                margin: 0,
                fontSize: `${bodyFontPt}pt`,
                lineHeight: 2.0,
                color: "#111827",
              }}
            >
              {item.options.map((option, optionIndex) => (
                <span
                  key={`${startIndex + idx}-opt-${optionIndex}`}
                  style={{ marginRight: "14px" }}
                >
                  {CIRCLE_NUMBERS[optionIndex]} ({option.join(")-(")}){" "}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
