"use client";

import { useEffect } from "react";
import type { FontFamily, SectionStyleConfig } from "@gyoanmaker/shared/types";
import { ensureFontFamilyLoaded } from "@/lib/font-loader";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

function addFamily(
  target: Set<FontFamily>,
  value: FontFamily | "" | undefined
): void {
  if (!value) return;
  target.add(value);
}

function addStyleFamily(
  target: Set<FontFamily>,
  style: SectionStyleConfig | undefined
): void {
  addFamily(target, style?.fontFamily);
}

export function useTemplateFontLoader(): void {
  const globalFontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const headerStyle = useTemplateSettingsStore((s) => s.headerStyle);
  const headerBadgeStyle = useTemplateSettingsStore((s) => s.headerBadgeStyle);
  const page1BodyStyle = useTemplateSettingsStore((s) => s.page1BodyStyle);
  const page2HeaderStyle = useTemplateSettingsStore((s) => s.page2HeaderStyle);
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);

  useEffect(() => {
    const families = new Set<FontFamily>();

    addFamily(families, globalFontFamily);
    addStyleFamily(families, headerStyle);
    addStyleFamily(families, headerBadgeStyle);
    addStyleFamily(families, page1BodyStyle);
    addStyleFamily(families, page2HeaderStyle);

    if (sectionStyles) {
      for (const style of Object.values(sectionStyles)) {
        addStyleFamily(families, style);
      }
    }

    for (const family of families) {
      ensureFontFamilyLoaded(family);
    }
  }, [
    globalFontFamily,
    headerStyle,
    headerBadgeStyle,
    page1BodyStyle,
    page2HeaderStyle,
    sectionStyles,
  ]);
}

