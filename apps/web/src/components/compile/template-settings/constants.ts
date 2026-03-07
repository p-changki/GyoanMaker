import { VALID_PAGE2_SECTIONS } from "@gyoanmaker/shared/types";
import type { FontScale, TitleWeight, ThemePreset, Page2SectionKey } from "@gyoanmaker/shared/types";

export const FONT_SCALE_OPTIONS: { key: FontScale; label: string }[] = [
  { key: "small", label: "작게" },
  { key: "medium", label: "보통" },
  { key: "large", label: "크게" },
];

export const TITLE_WEIGHT_KEYS: TitleWeight[] = ["bold", "extrabold", "black"];

export const PRESET_KEYS: ThemePreset[] = ["purple", "blue", "green", "black", "white"];

export const ALL_SECTIONS: Page2SectionKey[] = [...VALID_PAGE2_SECTIONS];
