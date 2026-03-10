"use client";

import type { WorkbookData } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

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
  const page1BodyStyle = useTemplateSettingsStore((s) => s.page1BodyStyle);

  const base = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...base, ...customColors } : base;
  const fontCss = page1BodyStyle?.fontFamily
    ? FONT_FAMILY_MAP[page1BodyStyle.fontFamily].css
    : FONT_FAMILY_MAP[fontFamily].css;

  const bodyFontPt = fontSizes.analysisEn ?? 10;

  // Flatten all step2 answers with continuous numbering
  const step2Answers = passages.flatMap((passage) =>
    passage.step2Items.map((item) => ({
      questionNumber: item.questionNumber,
      text: item.answerKey.join(" / "),
    }))
  );

  // Flatten all step3 answers with continuous numbering
  const step3Answers = passages.flatMap((passage) =>
    passage.step3Items.map((item) => {
      // Show the correct option ordering as answer text
      const correctOption = item.options[item.answerIndex];
      const answerText = correctOption
        ? `(${correctOption.join(")-(")})`
        : CIRCLE_NUMBERS[item.answerIndex] ?? "—";
      return {
        questionNumber: item.questionNumber,
        circleNumber: CIRCLE_NUMBERS[item.answerIndex] ?? "—",
        answerText,
      };
    })
  );

  return (
    <div style={{ fontFamily: fontCss, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <section>
        <h3 style={{ margin: "0 0 16px", fontSize: `${bodyFontPt + 2}pt`, color: colors.primary, fontWeight: 800 }}>
          STEP 2
        </h3>
        {step2Answers.map((answer, idx) => (
          <p
            key={`ans2-${idx}`}
            style={{ margin: "0 0 6px", fontSize: `${bodyFontPt}pt`, lineHeight: 1.8 }}
          >
            <span style={{ fontWeight: 700, color: colors.primary }}>{idx + 1})</span>{" "}
            {answer.text}
          </p>
        ))}
      </section>

      <section>
        <h3 style={{ margin: "0 0 16px", fontSize: `${bodyFontPt + 2}pt`, color: colors.primary, fontWeight: 800 }}>
          STEP 3
        </h3>
        {step3Answers.map((answer, idx) => (
          <p
            key={`ans3-${idx}`}
            style={{ margin: "0 0 6px", fontSize: `${bodyFontPt}pt`, lineHeight: 1.8 }}
          >
            <span style={{ fontWeight: 700, color: colors.primary }}>{idx + 1})</span>{" "}
            {answer.circleNumber} {answer.answerText}
          </p>
        ))}
      </section>
    </div>
  );
}
