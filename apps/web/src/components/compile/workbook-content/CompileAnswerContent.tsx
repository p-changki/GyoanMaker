"use client";

import type { WorkbookData } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];

interface CompileAnswerContentProps {
  passages: WorkbookData["passages"];
}

export default function CompileAnswerContent({ passages }: CompileAnswerContentProps) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);

  const base = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...base, ...customColors } : base;
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;

  const bodyFontSize = fontSizes.analysisEn ?? 10;

  const updateStep3Item = useWorkbookStore((state) => state.updateStep3Item);

  const step2Answers = passages.flatMap((passage) =>
    passage.step2Items.map((item) => ({
      questionNumber: item.questionNumber,
      text: item.answerKey.join(" / "),
    }))
  );

  const step3Answers = passages.flatMap((passage) =>
    passage.step3Items.map((item) => ({
      passageId: passage.passageId,
      questionNumber: item.questionNumber,
      answerIndex: item.answerIndex,
    }))
  );

  return (
    <div style={{ fontFamily: fontCss, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <section>
        <h3 style={{ margin: "0 0 12px", fontSize: `${bodyFontSize + 2}px`, color: colors.primary, fontWeight: 800 }}>
          STEP 2
        </h3>
        {step2Answers.map((answer) => (
          <p key={`step2-${answer.questionNumber}`} style={{ margin: "0 0 6px", fontSize: `${bodyFontSize - 1}px`, lineHeight: 1.5 }}>
            {answer.questionNumber}) {answer.text}
          </p>
        ))}
      </section>

      <section>
        <h3 style={{ margin: "0 0 12px", fontSize: `${bodyFontSize + 2}px`, color: colors.primary, fontWeight: 800 }}>
          STEP 3
        </h3>
        {step3Answers.map((answer) => (
          <div
            key={`step3-${answer.questionNumber}`}
            style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ fontSize: `${bodyFontSize - 1}px`, lineHeight: 1.5 }}>
              {answer.questionNumber})
            </span>
            {/* Static text for PDF */}
            <span style={{ fontSize: `${bodyFontSize - 1}px` }}>
              {CIRCLE_NUMBERS[answer.answerIndex] ?? CIRCLE_NUMBERS[0]}
            </span>
            {/* Editable selector — hidden from PDF */}
            <select
              data-html2canvas-ignore="true"
              value={answer.answerIndex}
              onChange={(event) => {
                const nextIndex = Number.parseInt(event.target.value, 10);
                if (!Number.isFinite(nextIndex)) return;
                updateStep3Item(answer.passageId, answer.questionNumber, (prev) => ({
                  ...prev,
                  answerIndex: nextIndex,
                }));
              }}
              style={{
                border: `1px solid ${colors.primary}`,
                borderRadius: "4px",
                fontSize: `${bodyFontSize - 2}px`,
                padding: "2px 6px",
                backgroundColor: "#fff",
                color: colors.primary,
                cursor: "pointer",
              }}
            >
              {CIRCLE_NUMBERS.map((symbol, index) => (
                <option key={`${answer.questionNumber}-${symbol}`} value={index}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>
    </div>
  );
}
