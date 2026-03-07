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

export default function CustomColorPicker() {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const setCustomThemeColors = useTemplateSettingsStore((s) => s.setCustomThemeColors);

  const baseColors = THEME_PRESETS[preset];
  const currentPrimary = customColors?.primary ?? baseColors.primary;

  function handleChange(hex: string) {
    const derived = deriveColors(hex);
    setCustomThemeColors(derived);
  }

  const preview = customColors ?? baseColors;

  return (
    <div className="space-y-3 mt-2">
      {/* Single color input */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-200 shrink-0">
          <input
            type="color"
            value={currentPrimary}
            onChange={(e) => handleChange(e.target.value)}
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer opacity-0"
          />
          <div className="w-full h-full pointer-events-none" style={{ backgroundColor: currentPrimary }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">주 색상 선택</p>
          <p className="text-[10px] text-gray-400">나머지 색상이 자동으로 맞춰집니다</p>
        </div>
      </label>

      {/* Derived colors preview */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "주", color: preview.primary },
          { label: "강조", color: preview.primaryDark },
          { label: "헤더", color: preview.headerBg },
          { label: "문장", color: preview.sentenceBg },
        ].map(({ label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-full h-5 rounded border border-gray-200" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
