import type { EditorFocus } from "@/stores/useEditorFocusStore";

interface ModalConfig {
  hasText: boolean;
  hasStyle: boolean;
}

export const SECTION_MODAL_CONFIG: Record<string, ModalConfig> = {
  header: { hasText: true, hasStyle: true },
  "header-badge": { hasText: true, hasStyle: true },
  "page1-title": { hasText: true, hasStyle: true },
  "page1-body": { hasText: false, hasStyle: true },
  "page2-header": { hasText: true, hasStyle: true },
  visual_summary: { hasText: true, hasStyle: true },
  topic: { hasText: true, hasStyle: true },
  summary: { hasText: true, hasStyle: true },
  flow: { hasText: true, hasStyle: true },
  vocabulary: { hasText: true, hasStyle: true },
  // custom_N sections default to { hasText: true, hasStyle: true } in SectionEditModal
};

export function getEditableSectionKey(focusKey: EditorFocus): string {
  switch (focusKey) {
    case "header":
      return "header";
    case "header-badge":
      return "headerBadge";
    case "page1-title":
      return "page1Body";
    case "page1-body":
      return "page1Body";
    case "page2-header":
      return "page2Header";
    default:
      return focusKey; // Page2SectionKey or CustomSectionKey
  }
}
