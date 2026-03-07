"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { DEFAULT_PAGE1_LAYOUT } from "@gyoanmaker/shared/types";
import type { Page1LayoutConfig } from "@gyoanmaker/shared/types";

const NUMBER_STYLES: { value: Page1LayoutConfig["numberStyle"]; label: string }[] = [
  { value: "padded", label: "01" },
  { value: "plain", label: "1" },
  { value: "circle", label: "①" },
];

export default function Page1LayoutSection() {
  const page1Layout = useTemplateSettingsStore((s) => s.page1Layout) ?? DEFAULT_PAGE1_LAYOUT;
  const setPage1Layout = useTemplateSettingsStore((s) => s.setPage1Layout);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        Page 1 레이아웃
      </p>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={page1Layout.headerVisible}
          onChange={(e) => setPage1Layout({ headerVisible: e.target.checked })}
          className="rounded border-gray-300 text-[#5E35B1] focus:ring-[#5E35B1] w-3.5 h-3.5"
        />
        <span className="text-xs font-medium text-gray-700">헤더 표시</span>
      </label>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">영어 컬럼 비율</span>
          <span className="text-xs font-mono text-gray-500">
            {Math.round(page1Layout.sentenceColumnRatio * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={80}
          step={1}
          value={Math.round(page1Layout.sentenceColumnRatio * 100)}
          onChange={(e) => setPage1Layout({ sentenceColumnRatio: Number(e.target.value) / 100 })}
          className="w-full h-1.5 rounded-full accent-[#5E35B1]"
        />
        <div className="flex justify-between text-[9px] text-gray-400">
          <span>50%</span>
          <span>80%</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-gray-600">번호 스타일</span>
        <div className="flex gap-1.5">
          {NUMBER_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPage1Layout({ numberStyle: value })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                page1Layout.numberStyle === value
                  ? "border-[#5E35B1] bg-[#5E35B1] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">테이블 테두리 두께</span>
          <span className="text-xs font-mono text-gray-500">{page1Layout.tableOuterBorderWidth}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={page1Layout.tableOuterBorderWidth}
          onChange={(e) => setPage1Layout({ tableOuterBorderWidth: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full accent-[#5E35B1]"
        />
      </div>
    </div>
  );
}
