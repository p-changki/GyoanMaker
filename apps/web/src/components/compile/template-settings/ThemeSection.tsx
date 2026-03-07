"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { THEME_PRESETS } from "@gyoanmaker/shared/types";
import { PRESET_KEYS } from "./constants";
import CustomColorPicker from "./CustomColorPicker";

interface Props {
  showCustomOption?: boolean;
}

export default function ThemeSection({ showCustomOption = false }: Props) {
  const themePreset = useTemplateSettingsStore((s) => s.themePreset);
  const setThemePreset = useTemplateSettingsStore((s) => s.setThemePreset);
  const useCustomTheme = useTemplateSettingsStore((s) => s.useCustomTheme) ?? false;
  const setUseCustomTheme = useTemplateSettingsStore((s) => s.setUseCustomTheme);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        컬러 테마
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_KEYS.map((key) => {
          const colors = THEME_PRESETS[key];
          const isSelected = themePreset === key && !useCustomTheme;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setThemePreset(key);
                setUseCustomTheme(false);
              }}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-gray-800 bg-white shadow-sm"
                  : "border-transparent bg-white/60 hover:border-gray-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full ${
                  key === "white"
                    ? "border-2 border-gray-300 bg-white"
                    : "border border-gray-200"
                }`}
                style={key !== "white" ? { backgroundColor: colors.primary } : undefined}
              />
              <span className="text-[9px] font-medium text-gray-600">{colors.label}</span>
            </button>
          );
        })}

        {showCustomOption && (
          <button
            type="button"
            onClick={() => setUseCustomTheme(!useCustomTheme)}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl border-2 transition-all ${
              useCustomTheme
                ? "border-gray-800 bg-white shadow-sm"
                : "border-transparent bg-white/60 hover:border-gray-200"
            }`}
          >
            <div className="w-6 h-6 rounded-full border border-gray-200 overflow-hidden">
              <div className="w-full h-1/2 bg-gradient-to-r from-red-400 to-blue-400" />
              <div className="w-full h-1/2 bg-gradient-to-r from-green-400 to-yellow-400" />
            </div>
            <span className="text-[9px] font-medium text-gray-600">커스텀</span>
          </button>
        )}
      </div>

      {showCustomOption && useCustomTheme && <CustomColorPicker />}
    </div>
  );
}
