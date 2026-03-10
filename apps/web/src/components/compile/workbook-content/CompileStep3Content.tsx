"use client";

import type { WorkbookStep3Item } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { EditableText } from "@/components/compile/EditableText";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];

interface CompileStep3ContentProps {
  passageId: string;
  passageTitle: string;
  items: WorkbookStep3Item[];
}

export default function CompileStep3Content({
  passageId,
  passageTitle,
  items,
}: CompileStep3ContentProps) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);

  const base = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...base, ...customColors } : base;
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const weightValue = TITLE_WEIGHT_MAP[titleWeight].value;

  const bodyFontSize = fontSizes.analysisEn ?? 10;

  const updateStep3Item = useWorkbookStore((state) => state.updateStep3Item);

  return (
    <div style={{ fontFamily: fontCss }}>
      {/* Passage title bar */}
      <div
        className="mb-4"
        style={{
          borderLeft: `4px solid ${colors.primary}`,
          paddingLeft: "10px",
        }}
      >
        <p style={{ margin: 0, fontSize: `${bodyFontSize - 2}px`, color: "#6B7280", fontWeight: 700 }}>
          {passageId}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: `${bodyFontSize + 3}px`, fontWeight: weightValue, color: "#111827" }}>
          {passageTitle || passageId}
        </p>
      </div>

      {/* Question list */}
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item) => (
          <li key={`${passageId}-${item.questionNumber}`} className="mb-6">
            {/* Question number */}
            <p style={{ margin: "0 0 4px", fontSize: `${bodyFontSize}px`, fontWeight: 700, color: colors.primary }}>
              {String(item.questionNumber).padStart(2, "0")}. {item.passageNumber})
            </p>

            {/* Intro */}
            <EditableText
              value={item.intro}
              label="STEP 3 Intro"
              multiline
              maxLength={2000}
              as="p"
              themeColor={colors.primary}
              style={{ margin: "0 0 8px", fontSize: `${bodyFontSize}px`, lineHeight: 1.8 }}
              onConfirm={(next) =>
                updateStep3Item(passageId, item.questionNumber, (prev) => ({
                  ...prev,
                  intro: next,
                }))
              }
            />

            {/* Paragraphs */}
            <div className="mb-2">
              {item.paragraphs.map((paragraph, paragraphIndex) => (
                <EditableText
                  key={`${item.questionNumber}-${paragraph.label}`}
                  value={`(${paragraph.label}) ${paragraph.text}`}
                  label={`Paragraph ${paragraph.label}`}
                  multiline
                  maxLength={3000}
                  as="p"
                  themeColor={colors.primary}
                  style={{ margin: "0 0 2px", fontSize: `${bodyFontSize}px`, lineHeight: 1.8 }}
                  onConfirm={(next) =>
                    updateStep3Item(passageId, item.questionNumber, (prev) => ({
                      ...prev,
                      paragraphs: prev.paragraphs.map((p, idx) =>
                        idx !== paragraphIndex
                          ? p
                          : { ...p, text: next.replace(/^\([A-D]\)\s*/, "") }
                      ),
                    }))
                  }
                />
              ))}
            </div>

            {/* Options */}
            <p style={{ margin: "6px 0 4px", fontSize: `${bodyFontSize}px`, lineHeight: 1.7 }}>
              {item.options.map((option, optionIndex) => (
                <span key={`${item.questionNumber}-option-${optionIndex}`} style={{ marginRight: "12px" }}>
                  {CIRCLE_NUMBERS[optionIndex]} ({option.join(")-(")})
                </span>
              ))}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
