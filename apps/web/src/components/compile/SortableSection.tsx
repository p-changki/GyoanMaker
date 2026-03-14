"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  id: string;
  children: React.ReactNode;
}

export default function SortableSection({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {children}

      {/* Drag handle bar — top center, hidden from PDF */}
      <div
        data-html2canvas-ignore="true"
        className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/sortable:opacity-100 transition-opacity z-50"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm cursor-grab active:cursor-grabbing touch-none hover:bg-purple-50 hover:border-purple-300 transition-colors"
          aria-label="드래그하여 순서 변경"
        >
          <svg
            className="w-3.5 h-3.5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
          <span className="text-[10px] font-medium text-gray-400">드래그</span>
        </button>
      </div>

      {/* Drag indicator ring — hidden from PDF */}
      {isDragging && (
        <div data-html2canvas-ignore="true" className="absolute inset-0 rounded-lg ring-2 ring-purple-300 bg-purple-50/30 pointer-events-none z-40" />
      )}
    </div>
  );
}
