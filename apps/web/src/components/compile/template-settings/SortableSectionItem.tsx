"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";
import { PAGE2_SECTION_LABELS, isBuiltInSectionKey, isCustomSectionKey } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

interface Props {
  id: Page2SectionKey;
  isActive: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export default function SortableSectionItem({ id, isActive, onToggle, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const customTitle = useTemplateSettingsStore((s) =>
    isCustomSectionKey(id) ? s.customSections?.[id]?.title : undefined
  );

  const label = isBuiltInSectionKey(id)
    ? PAGE2_SECTION_LABELS[id]
    : customTitle || "새 섹션";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white transition-colors"
    >
      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
        <input
          type="checkbox"
          checked={isActive}
          onChange={onToggle}
          className="rounded border-gray-300 text-[#5E35B1] focus:ring-[#5E35B1] w-3.5 h-3.5 shrink-0"
        />
        <span className={`text-xs font-medium truncate ${isActive ? "text-gray-700" : "text-gray-400 line-through"}`}>
          {label}
        </span>
      </label>
      <div className="flex items-center gap-0.5 shrink-0">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-300 hover:text-red-500 transition-colors"
            aria-label="섹션 삭제"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          aria-label="드래그하여 순서 변경"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
