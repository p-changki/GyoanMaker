"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { VALID_PAGE2_SECTIONS, MAX_CUSTOM_SECTIONS, isCustomSectionKey } from "@gyoanmaker/shared/types";
import type { Page2SectionKey, CustomSectionKey } from "@gyoanmaker/shared/types";
import SortableSectionItem from "./SortableSectionItem";

const BUILTIN_SECTIONS = [...VALID_PAGE2_SECTIONS] as Page2SectionKey[];

export default function SectionConfigPanel() {
  const page2Sections = useTemplateSettingsStore((s) => s.page2Sections);
  const customSections = useTemplateSettingsStore((s) => s.customSections);
  const toggleSection = useTemplateSettingsStore((s) => s.toggleSection);
  const addCustomSection = useTemplateSettingsStore((s) => s.addCustomSection);
  const removeCustomSection = useTemplateSettingsStore((s) => s.removeCustomSection);
  const set = useTemplateSettingsStore.setState;

  const customCount = Object.keys(customSections ?? {}).length;
  const customKeys = Object.keys(customSections ?? {}).filter(isCustomSectionKey) as CustomSectionKey[];

  // All sections: built-in (always shown) + custom (from customSections)
  const allSections: Page2SectionKey[] = [...BUILTIN_SECTIONS, ...customKeys];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = page2Sections.indexOf(active.id as Page2SectionKey);
    const newIndex = page2Sections.indexOf(over.id as Page2SectionKey);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove([...page2Sections], oldIndex, newIndex);
    set({ page2Sections: newOrder });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          Page 2 섹션
        </p>
        {customCount < MAX_CUSTOM_SECTIONS && (
          <button
            type="button"
            onClick={addCustomSection}
            className="text-[10px] font-bold text-[#5E35B1] hover:text-[#4527A0] transition-colors"
          >
            + 섹션 추가
          </button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={page2Sections} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {allSections.map((key) => {
              const isActive = page2Sections.includes(key);
              const isCustom = isCustomSectionKey(key);
              return (
                <SortableSectionItem
                  key={key}
                  id={key}
                  isActive={isActive}
                  onToggle={() => toggleSection(key)}
                  onDelete={isCustom ? () => removeCustomSection(key) : undefined}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
