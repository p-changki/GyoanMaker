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
import { VALID_PAGE2_SECTIONS } from "@gyoanmaker/shared/types";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";
import SortableSectionItem from "./SortableSectionItem";

const ALL_SECTIONS = [...VALID_PAGE2_SECTIONS] as Page2SectionKey[];

export default function SectionConfigPanel() {
  const page2Sections = useTemplateSettingsStore((s) => s.page2Sections);
  const toggleSection = useTemplateSettingsStore((s) => s.toggleSection);
  const set = useTemplateSettingsStore.setState;

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
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        Page 2 섹션
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={page2Sections} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {ALL_SECTIONS.map((key) => {
              const isActive = page2Sections.includes(key);
              return (
                <SortableSectionItem
                  key={key}
                  id={key}
                  isActive={isActive}
                  onToggle={() => toggleSection(key)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
