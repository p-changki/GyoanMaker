"use client";

import type { CustomSectionKey } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import UnifiedSectionEditor from "./UnifiedSectionEditor";
import SaveControls from "./SaveControls";
import { useTemplateSettingsPanel } from "./useTemplateSettingsPanel";

interface Props {
  sectionKey: CustomSectionKey;
}

export default function CustomSectionPanel({ sectionKey }: Props) {
  const content = useTemplateSettingsStore((s) => s.customSections?.[sectionKey]);
  const setContent = useTemplateSettingsStore((s) => s.setCustomSectionContent);
  const setFocus = useEditorFocusStore((s) => s.setFocus);
  const { isSaving, saveMessage, saveMessageType, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();

  if (!content) return null;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setFocus("global")}
        className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors mb-4"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        전체 설정
        <span className="text-gray-300 mx-0.5">&middot;</span>
        <span className="text-gray-600">{content.title || "커스텀 섹션"}</span>
      </button>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
          섹션 제목
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => setContent(sectionKey, { title: e.target.value })}
          placeholder="섹션 제목 입력"
          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
          본문 내용
        </label>
        <textarea
          value={content.body}
          onChange={(e) => setContent(sectionKey, { body: e.target.value })}
          placeholder="섹션 본문을 입력하세요..."
          rows={6}
          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5E35B1] focus:border-[#5E35B1] resize-y"
        />
      </div>

      <UnifiedSectionEditor sectionKey={sectionKey} />
      <SaveControls
        isSaving={isSaving}
        saveMessage={saveMessage}
        saveMessageType={saveMessageType}
        onSave={handleSave}
        onReset={handleResetToDefaults}
      />
    </div>
  );
}
