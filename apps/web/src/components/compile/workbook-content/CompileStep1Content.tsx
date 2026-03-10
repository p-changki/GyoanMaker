"use client";

import { useCallback } from "react";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { EditableText } from "@/components/compile/EditableText";

interface CompileStep1ContentProps {
  sentences: string[];
  /** Global starting index (0-based) for continuous numbering */
  startIndex: number;
  onUpdateSentence?: (localIdx: number, newText: string) => void;
}

export default function CompileStep1Content({
  sentences,
  startIndex,
  onUpdateSentence,
}: CompileStep1ContentProps) {
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

  const handleConfirm = useCallback(
    (idx: number, newText: string) => {
      onUpdateSentence?.(idx, newText);
    },
    [onUpdateSentence]
  );

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
          ▶ 스스로 분석 &gt; 핵심 내용 파악 &gt; 출제 예상 포인트 정리!
        </p>
      )}

      {/* Sentences with fixed spacing — reliable in both preview and PDF */}
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {sentences.map((entry, idx) => (
          <li
            key={`s1-${startIndex + idx}`}
            style={{ marginBottom: "56px" }}
          >
            <EditableText
              as="div"
              value={entry}
              label="STEP 1 문장 수정"
              maxLength={1000}
              multiline
              themeColor={colors.primary}
              onConfirm={(newText) => handleConfirm(idx, newText)}
              style={{
                fontSize: `${bodyFontPt}pt`,
                lineHeight: 2.1,
                textAlign: "justify",
                textIndent: "-1.6em",
                paddingLeft: "1.6em",
                color: "#111827",
              }}
              renderDisplay={(value) => (
                <>
                  <span
                    style={{
                      fontWeight: 900,
                      color: colors.primary,
                      marginRight: "6px",
                      fontSize: `${bodyFontPt + 1}pt`,
                    }}
                  >
                    {startIndex + idx + 1}.
                  </span>
                  {value}
                </>
              )}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
