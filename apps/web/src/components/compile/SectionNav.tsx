"use client";

import { memo, useCallback, useMemo } from "react";
import { useHandoutStore } from "@/stores/useHandoutStore";

interface SectionNavProps {
  onNavigate?: () => void;
}

export default function SectionNav({ onNavigate: onNavCallback }: SectionNavProps) {
  const sections = useHandoutStore((state) => state.sections);
  const setActiveId = useHandoutStore((state) => state.setActiveId);

  const activeIds = useMemo(
    () =>
      Object.keys(sections)
        .filter((id) => {
          const s = sections[id];
          return s && s.rawText.trim().length > 0;
        })
        .sort(),
    [sections]
  );

  const onNavigate = useCallback(
    (id: string) => {
      setActiveId(id);
      const element = document.getElementById(`section-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      onNavCallback?.();
    },
    [setActiveId, onNavCallback]
  );

  return (
    <aside className="w-full h-full bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-black text-[#5E35B1] uppercase tracking-wider">
          Section List
        </h2>
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
          Total {activeIds.length} Passages
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {activeIds.map((id) => (
          <SectionNavItem key={id} id={id} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}

const SectionNavItem = memo(function SectionNavItem({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate: (id: string) => void;
}) {
  const isCompleted = useHandoutStore((state) =>
    Boolean(state.sections[id]?.isParsed)
  );
  const isActive = useHandoutStore((state) => state.activeId === id);

  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
        isActive
          ? "bg-[#5E35B1] text-white shadow-lg shadow-purple-100"
          : "hover:bg-purple-50 text-gray-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`text-[11px] font-black w-8 h-5 flex items-center justify-center rounded-md ${
            isActive
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-400 group-hover:bg-purple-100 group-hover:text-[#5E35B1]"
          }`}
        >
          {id}
        </span>
        <span className="text-sm font-bold tracking-tight">
          지문 {id.slice(1)}
        </span>
      </div>

      {isCompleted && (
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? "bg-white" : "bg-green-500"
          } shadow-sm`}
        />
      )}
    </button>
  );
});
