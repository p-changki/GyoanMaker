"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

export default function DefaultTextsSection() {
  const defaultHeaderText = useTemplateSettingsStore((s) => s.defaultHeaderText);
  const setDefaultHeaderText = useTemplateSettingsStore((s) => s.setDefaultHeaderText);
  const defaultAnalysisTitle = useTemplateSettingsStore((s) => s.defaultAnalysisTitle);
  const setDefaultAnalysisTitle = useTemplateSettingsStore((s) => s.setDefaultAnalysisTitle);
  const defaultSummaryTitle = useTemplateSettingsStore((s) => s.defaultSummaryTitle);
  const setDefaultSummaryTitle = useTemplateSettingsStore((s) => s.setDefaultSummaryTitle);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        기본 제목 설정
      </p>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">교안 헤더</label>
          <input
            type="text"
            value={defaultHeaderText ?? ""}
            onChange={(e) => setDefaultHeaderText(e.target.value || null)}
            placeholder="고1 25년 9월 모의고사"
            maxLength={50}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">분석 타이틀</label>
          <input
            type="text"
            value={defaultAnalysisTitle ?? ""}
            onChange={(e) => setDefaultAnalysisTitle(e.target.value || null)}
            placeholder="구문 분석 및 해석"
            maxLength={50}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">요약 타이틀</label>
          <input
            type="text"
            value={defaultSummaryTitle ?? ""}
            onChange={(e) => setDefaultSummaryTitle(e.target.value || null)}
            placeholder="PICK 핵심 정리"
            maxLength={50}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] bg-white"
          />
        </div>
        <p className="text-[9px] text-gray-400">비워두면 기본값이 사용됩니다</p>
      </div>
    </div>
  );
}
