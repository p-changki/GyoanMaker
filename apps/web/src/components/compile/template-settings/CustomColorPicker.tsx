"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { THEME_PRESETS } from "@gyoanmaker/shared/types";

/** hex → {r, g, b} */
function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** {r, g, b} → hex */
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

/** 주 색상 1개로 나머지 3개 자동 파생 */
function deriveColors(primary: string) {
  const { r, g, b } = hexToRgb(primary);
  const primaryDark = rgbToHex(r * 0.85, g * 0.85, b * 0.85);
  const headerBg = rgbToHex(255 - (255 - r) * 0.12, 255 - (255 - g) * 0.08, 255 - (255 - b) * 0.08);
  const sentenceBg = rgbToHex(255 - (255 - r) * 0.08, 255 - (255 - g) * 0.05, 255 - (255 - b) * 0.05);
  return { primary, primaryDark, headerBg, sentenceBg };
}

type ColorKey = "primary" | "primaryDark" | "headerBg" | "sentenceBg";

const COLOR_FIELDS: { key: ColorKey; label: string; description: string }[] = [
  { key: "primary", label: "주", description: "메인 테마 색상" },
  { key: "primaryDark", label: "강조", description: "제목/강조 배경" },
  { key: "headerBg", label: "헤더", description: "섹션 헤더 배경" },
  { key: "sentenceBg", label: "문장", description: "문장 영역 배경" },
];

function ColorSwatch({
  color,
  label,
  description,
  onChange,
}: {
  color: string;
  label: string;
  description: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-gray-200 shrink-0 group-hover:border-gray-300 transition-colors">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer opacity-0"
        />
        <div className="w-full h-full pointer-events-none" style={{ backgroundColor: color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-600">{label}</p>
        <p className="text-[9px] text-gray-400">{description}</p>
      </div>
    </label>
  );
}

export default function CustomColorPicker() {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const setCustomThemeColors = useTemplateSettingsStore((s) => s.setCustomThemeColors);

  const baseColors = THEME_PRESETS[preset];
  const current = customColors ?? baseColors;

  function handlePrimaryChange(hex: string) {
    // Primary changes → auto-derive all others
    const derived = deriveColors(hex);
    setCustomThemeColors(derived);
  }

  function handleIndividualChange(key: ColorKey, hex: string) {
    // Individual change → only update that specific color
    setCustomThemeColors({ ...current, [key]: hex });
  }

  function handleReset() {
    // Reset to auto-derived from current primary
    const derived = deriveColors(current.primary);
    setCustomThemeColors(derived);
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Primary: main color picker */}
      <div className="space-y-2.5">
        {COLOR_FIELDS.map(({ key, label, description }) => (
          <ColorSwatch
            key={key}
            color={current[key]}
            label={label}
            description={key === "primary" ? "주 색상 변경 시 나머지 자동 파생" : description}
            onChange={(hex) =>
              key === "primary"
                ? handlePrimaryChange(hex)
                : handleIndividualChange(key, hex)
            }
          />
        ))}
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={handleReset}
        className="text-[10px] text-gray-400 hover:text-[#5E35B1] transition-colors"
      >
        주 색상 기준으로 초기화
      </button>
    </div>
  );
}
