"use client";

import { useCallback, type ReactNode } from "react";
import type { WorkbookStep2Item } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { EditableText } from "@/components/compile/EditableText";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

/** Flat step2 item with passageId attached for store updates */
export interface FlatStep2Item extends WorkbookStep2Item {
  passageId: string;
}

interface CompileStep2ContentProps {
  items: FlatStep2Item[];
  /** Global starting index (0-based) for continuous numbering */
  startIndex: number;
}

/**
 * Parse sentenceTemplate and bold the [A / B] bracket parts.
 * e.g. "I decided [to join / joining] the club." →
 *   ["I decided ", <bold>[to join / joining]</bold>, " the club."]
 */
function renderBoldBrackets(
  template: string,
  primaryColor: string,
  fontPt: number
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    // Text before bracket
    if (match.index > lastIndex) {
      parts.push(template.slice(lastIndex, match.index));
    }
    // Bold bracket part
    parts.push(
      <span
        key={`br-${match.index}`}
        style={{
          fontWeight: 900,
          color: primaryColor,
          fontSize: `${fontPt + 1}pt`,
        }}
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }

  return parts;
}

export default function CompileStep2Content({
  items,
  startIndex,
}: CompileStep2ContentProps) {
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

  const updateStep2Item = useWorkbookStore((state) => state.updateStep2Item);

  const handleConfirm = useCallback(
    (item: FlatStep2Item, newValue: string) => {
      updateStep2Item(item.passageId, item.questionNumber, (prev) => ({
        ...prev,
        sentenceTemplate: newValue,
      }));
    },
    [updateStep2Item],
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
          ▶ 다음 문장에서 어법/어휘상 알맞은 것을 고르시오.
        </p>
      )}

      {/* Items with fixed spacing — matches STEP 1 design */}
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, idx) => (
          <li
            key={`s2-${startIndex + idx}`}
            style={{ marginBottom: "56px" }}
          >
            <EditableText
              as="div"
              value={item.sentenceTemplate}
              label="STEP 2 문장 템플릿 수정"
              maxLength={1000}
              multiline
              themeColor={colors.primary}
              onConfirm={(newValue) => handleConfirm(item, newValue)}
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
                  {renderBoldBrackets(value, colors.primary, bodyFontPt)}
                </>
              )}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
