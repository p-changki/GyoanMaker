export type BuiltInSectionKey =
  | "visual_summary"
  | "topic"
  | "summary"
  | "flow"
  | "vocabulary";
export type CustomSectionKey = `custom_${number}`;
export type Page2SectionKey = BuiltInSectionKey | CustomSectionKey;

export const MAX_CUSTOM_SECTIONS = 5;

export interface CustomSectionContent {
  title: string;
  body: string;
}

export function isCustomSectionKey(key: string): key is CustomSectionKey {
  return /^custom_\d+$/.test(key);
}

export function isBuiltInSectionKey(key: string): key is BuiltInSectionKey {
  return (
    key === "visual_summary" ||
    key === "topic" ||
    key === "summary" ||
    key === "flow" ||
    key === "vocabulary"
  );
}

export type ThemePreset = "purple" | "blue" | "green" | "black" | "white";

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  headerBg: string;
  sentenceBg: string;
  label: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  purple: {
    primary: "#5E35B1",
    primaryDark: "#4527A0",
    headerBg: "#FFE4E1",
    sentenceBg: "#FFE8E8",
    label: "퍼플",
  },
  blue: {
    primary: "#1565C0",
    primaryDark: "#0D47A1",
    headerBg: "#E3F2FD",
    sentenceBg: "#BBDEFB",
    label: "블루",
  },
  green: {
    primary: "#2E7D32",
    primaryDark: "#1B5E20",
    headerBg: "#E8F5E9",
    sentenceBg: "#C8E6C9",
    label: "그린",
  },
  black: {
    primary: "#212121",
    primaryDark: "#000000",
    headerBg: "#F5F5F5",
    sentenceBg: "#EEEEEE",
    label: "블랙",
  },
  white: {
    primary: "#757575",
    primaryDark: "#424242",
    headerBg: "#FFFFFF",
    sentenceBg: "#FAFAFA",
    label: "화이트",
  },
};

export const VALID_THEME_PRESETS: ReadonlySet<ThemePreset> = new Set([
  "purple",
  "blue",
  "green",
  "black",
  "white",
]);

export type FontScale = "small" | "medium" | "large";
export type FontFamily = "pretendard" | "gmarket" | "gmarketBold" | "gmarketMedium" | "noto" | "nanumSquare" | "spoqa" | "suit" | "nanumGothic" | "kopubDotum" | "timesNewRoman";
export type TitleWeight = "bold" | "extrabold" | "black";

export const VALID_FONT_SCALES: ReadonlySet<FontScale> = new Set(["small", "medium", "large"]);
export const VALID_FONT_FAMILIES: ReadonlySet<FontFamily> = new Set(["pretendard", "gmarket", "gmarketBold", "gmarketMedium", "noto", "nanumSquare", "spoqa", "suit", "nanumGothic", "kopubDotum", "timesNewRoman"]);
export const VALID_TITLE_WEIGHTS: ReadonlySet<TitleWeight> = new Set(["bold", "extrabold", "black"]);

export interface FontScaleValues {
  bodyEn: string;
  bodyKo: string;
  sectionTitle: string;
  tableCell: string;
}

export const FONT_SCALE_MAP: Record<FontScale, FontScaleValues> = {
  small:  { bodyEn: "9pt",  bodyKo: "7pt",  sectionTitle: "12px", tableCell: "10.5px" },
  medium: { bodyEn: "10pt", bodyKo: "8pt",  sectionTitle: "13px", tableCell: "11.5px" },
  large:  { bodyEn: "11pt", bodyKo: "9pt",  sectionTitle: "14px", tableCell: "12.5px" },
};

export const FONT_FAMILY_MAP: Record<FontFamily, { label: string; css: string }> = {
  pretendard:  { label: "프리텐다드",       css: '"Pretendard Variable", Pretendard, sans-serif' },
  noto:        { label: "노토산스",         css: '"Noto Sans KR", sans-serif' },
  nanumSquare: { label: "나눔스퀘어",       css: '"NanumSquare", sans-serif' },
  nanumGothic: { label: "나눔고딕",         css: '"NanumGothic", sans-serif' },
  gmarket:     { label: "지마켓산스",       css: '"GmarketSans", sans-serif' },
  spoqa:       { label: "스포카한산스네오", css: '"Spoqa Han Sans Neo", sans-serif' },
  suit:        { label: "SUIT",             css: '"SUIT", sans-serif' },
  gmarketBold: { label: "지마켓산스 Bold",  css: '"GmarketSansBold", "GmarketSans", sans-serif' },
  gmarketMedium:{ label: "지마켓산스 Medium",css: '"GmarketSansMedium", "GmarketSans", sans-serif' },
  kopubDotum:  { label: "KoPub돋움체",     css: '"KoPub Dotum", "KoPubDotumMedium", sans-serif' },
  timesNewRoman:{ label: "Times New Roman", css: '"Times New Roman", Times, serif' },
};

export const TITLE_WEIGHT_MAP: Record<TitleWeight, { label: string; value: number }> = {
  bold:      { label: "보통",   value: 700 },
  extrabold: { label: "두껍게", value: 800 },
  black:     { label: "최대",   value: 900 },
};

export interface FontSizeConfig {
  // per-section text sizes
  analysisEn: number;
  analysisKo: number;
  topicEn: number;
  topicKo: number;
  summaryEn: number;
  summaryKo: number;
  visualEn: number;
  visualKo: number;
  flowText: number;
  vocabText: number;
  // global UI elements
  sectionTitle: number;
  headerLogo: number;
  headerBadge: number;
  passageNumber: number;
  sentenceNumber: number;
  summaryBarTitle: number;
  pageFooter: number;
}

export interface FontSizeSlotMeta {
  label: string;
  unit: "pt" | "px";
  step: number;
  min: number;
  max: number;
}

export const FONT_SIZE_PRESETS: Record<FontScale, FontSizeConfig> = {
  small: {
    analysisEn: 9, analysisKo: 7, topicEn: 9, topicKo: 7,
    summaryEn: 9, summaryKo: 7, visualEn: 9, visualKo: 7, flowText: 10.5, vocabText: 10.5,
    sectionTitle: 12, headerLogo: 32, headerBadge: 11, passageNumber: 32,
    sentenceNumber: 12, summaryBarTitle: 13, pageFooter: 10,
  },
  medium: {
    analysisEn: 10, analysisKo: 8, topicEn: 10, topicKo: 8,
    summaryEn: 10, summaryKo: 8, visualEn: 10, visualKo: 8, flowText: 11.5, vocabText: 11.5,
    sectionTitle: 13, headerLogo: 36, headerBadge: 13, passageNumber: 36,
    sentenceNumber: 14, summaryBarTitle: 15, pageFooter: 12,
  },
  large: {
    analysisEn: 11, analysisKo: 9, topicEn: 11, topicKo: 9,
    summaryEn: 11, summaryKo: 9, visualEn: 11, visualKo: 9, flowText: 12.5, vocabText: 12.5,
    sectionTitle: 14, headerLogo: 40, headerBadge: 15, passageNumber: 40,
    sentenceNumber: 16, summaryBarTitle: 17, pageFooter: 14,
  },
};

export const FONT_SIZE_SLOT_META: Record<keyof FontSizeConfig, FontSizeSlotMeta> = {
  analysisEn:     { label: "영어",           unit: "pt", step: 0.5, min: 7,  max: 14 },
  analysisKo:     { label: "한국어",         unit: "pt", step: 0.5, min: 5,  max: 12 },
  topicEn:        { label: "영어",           unit: "pt", step: 0.5, min: 7,  max: 14 },
  topicKo:        { label: "한국어",         unit: "pt", step: 0.5, min: 5,  max: 12 },
  summaryEn:      { label: "영어",           unit: "pt", step: 0.5, min: 7,  max: 14 },
  summaryKo:      { label: "한국어",         unit: "pt", step: 0.5, min: 5,  max: 12 },
  visualEn:       { label: "영어",           unit: "pt", step: 0.5, min: 7,  max: 14 },
  visualKo:       { label: "한국어",         unit: "pt", step: 0.5, min: 5,  max: 12 },
  flowText:       { label: "텍스트",         unit: "px", step: 0.5, min: 8,  max: 16 },
  vocabText:      { label: "텍스트",         unit: "px", step: 0.5, min: 8,  max: 16 },
  sectionTitle:   { label: "섹션 타이틀",    unit: "px", step: 0.5, min: 10, max: 18 },
  headerLogo:     { label: "헤더 학원명",    unit: "px", step: 1,   min: 20, max: 48 },
  headerBadge:    { label: "헤더 뱃지",      unit: "px", step: 0.5, min: 8,  max: 18 },
  passageNumber:  { label: "지문 번호",      unit: "px", step: 1,   min: 24, max: 48 },
  sentenceNumber: { label: "문장 번호",      unit: "px", step: 0.5, min: 10, max: 20 },
  summaryBarTitle:{ label: "요약 바 타이틀", unit: "px", step: 0.5, min: 10, max: 20 },
  pageFooter:     { label: "페이지 번호",    unit: "px", step: 0.5, min: 8,  max: 16 },
};

export const FONT_SIZE_GROUPS: { label: string; keys: (keyof FontSizeConfig)[] }[] = [
  { label: "구문분석", keys: ["analysisEn", "analysisKo"] },
  { label: "주제문",   keys: ["topicEn", "topicKo"] },
  { label: "요약",     keys: ["summaryEn", "summaryKo"] },
  { label: "내용정리", keys: ["flowText"] },
  { label: "어휘",     keys: ["vocabText"] },
  { label: "공통 UI",  keys: ["sectionTitle", "headerLogo", "headerBadge", "passageNumber", "sentenceNumber", "summaryBarTitle", "pageFooter"] },
];

// --- Phase 1 extensions ---

export interface Page1LayoutConfig {
  headerVisible: boolean;
  sentenceColumnRatio: number;    // 0.5 ~ 0.8 (default: 0.65)
  numberStyle: "padded" | "plain" | "circle";
  tableOuterBorderWidth: number;  // px (default: 3)
  showSentenceNumbers?: boolean;  // default true
  showKoreanColumn?: boolean;     // default true
}

export const DEFAULT_PAGE1_LAYOUT: Page1LayoutConfig = {
  headerVisible: true,
  sentenceColumnRatio: 0.65,
  numberStyle: "padded",
  tableOuterBorderWidth: 3,
  showSentenceNumbers: true,
  showKoreanColumn: true,
};

export interface SectionStyleConfig {
  paddingTop: number;
  paddingBottom: number;
  borderStyle: "none" | "solid" | "dashed";
  borderColor: string;  // "" = theme primary
  titleColor: string;   // "" = theme primary
  bgColor: string;      // "" = transparent / default
  textColor: string;    // "" = #111827
  fontFamily: FontFamily | "";   // "" = use global setting
  titleWeight: TitleWeight | ""; // "" = use global setting
  textAlign: "left" | "center" | "right" | ""; // "" = default (left)
  badgeShape?: "rounded-full" | "rounded-lg" | "rounded-none"; // badge corner style
  badgeBgColor?: string;   // badge background color ("" = transparent/white)
  badgeFontSize?: number;  // badge font size in px
  badgeAlign?: "left" | "center" | "right"; // badge alignment
  barWidth?: number; // bar width as percentage (20~100), default 95
}

export const DEFAULT_SECTION_STYLE: SectionStyleConfig = {
  paddingTop: 0,
  paddingBottom: 0,
  borderStyle: "none",
  borderColor: "",
  titleColor: "",
  bgColor: "",
  textColor: "",
  fontFamily: "",
  titleWeight: "",
  textAlign: "",
};

export type BuiltInEditableKey = BuiltInSectionKey | "page1Body" | "page2Header" | "header" | "headerBadge";
export type EditableSectionKey = Page2SectionKey | "page1Body" | "page2Header" | "header" | "headerBadge";

export const SECTION_FONT_SIZE_KEYS: Record<BuiltInEditableKey, (keyof FontSizeConfig)[]> = {
  header:      ["headerLogo", "passageNumber"],
  headerBadge: ["headerBadge"],
  page1Body:   ["analysisEn", "analysisKo", "sentenceNumber"],
  page2Header: ["summaryBarTitle"],
  visual_summary: ["visualEn", "visualKo", "flowText", "sectionTitle"],
  topic:      ["topicEn", "topicKo", "sectionTitle"],
  summary:    ["summaryEn", "summaryKo", "sectionTitle"],
  flow:       ["flowText", "sectionTitle"],
  vocabulary: ["vocabText", "sectionTitle"],
};

export const CUSTOM_SECTION_FONT_SIZE_KEYS: (keyof FontSizeConfig)[] = ["sectionTitle"];

export function getSectionFontSizeKeys(key: EditableSectionKey): (keyof FontSizeConfig)[] {
  if (isCustomSectionKey(key)) return CUSTOM_SECTION_FONT_SIZE_KEYS;
  return SECTION_FONT_SIZE_KEYS[key as BuiltInEditableKey] ?? CUSTOM_SECTION_FONT_SIZE_KEYS;
}

export const EDITABLE_SECTION_LABELS: Record<BuiltInEditableKey, string> = {
  header: "헤더",
  headerBadge: "헤더 배지",
  page1Body: "문장 테이블",
  page2Header: "요약바",
  visual_summary: "삽화 요약",
  topic: "주제문",
  summary: "요약",
  flow: "내용 정리",
  vocabulary: "핵심 어휘",
};

// Phase 2: display config types
export interface VocabDisplayConfig {
  showSynonyms?: boolean;  // default true
  showAntonyms?: boolean;  // default true
}

export type SummaryLanguage = "both" | "en" | "ko";

export interface ImageDisplayConfig {
  scale: number;     // 0.5 ~ 2.0, default 1.0
  offsetX: number;   // px offset, default 0
  offsetY: number;   // px offset, default 0
  layer: "front" | "back";  // front = above bar, back = behind bar
}

export const DEFAULT_IMAGE_DISPLAY: ImageDisplayConfig = {
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  layer: "front",
};

export interface CustomThemeColors {
  primary: string;
  primaryDark: string;
  headerBg: string;
  sentenceBg: string;
}

export type VocabColumnLayout = 4 | 3 | 2;

export interface SavedTemplate {
  id: string;
  name: string;
  settings: TemplateSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSettings {
  academyName: string | null;
  logoBase64: string | null;
  avatarBase64: string | null;
  page2Sections: Page2SectionKey[];
  themePreset: ThemePreset;
  defaultHeaderText: string | null;
  defaultAnalysisTitle: string | null;
  defaultSummaryTitle: string | null;
  fontScale: FontScale;
  fontFamily: FontFamily;
  titleWeight: TitleWeight;
  fontSizes: FontSizeConfig;
  // Phase 1 optional fields
  page1Layout?: Page1LayoutConfig;
  headerStyle?: SectionStyleConfig;
  headerBadgeStyle?: SectionStyleConfig;
  page1BodyStyle?: SectionStyleConfig;
  page2HeaderStyle?: SectionStyleConfig;
  sectionStyles?: Partial<Record<Page2SectionKey, SectionStyleConfig>>;
  vocabColumnLayout?: VocabColumnLayout;
  customThemeColors?: CustomThemeColors | null;
  useCustomTheme?: boolean;
  // Custom sections
  customSections?: Record<string, CustomSectionContent>;
  // Phase 2: display options
  vocabDisplay?: VocabDisplayConfig;
  summaryLanguage?: SummaryLanguage;
  // Image display config
  logoDisplay?: ImageDisplayConfig;
  avatarDisplay?: ImageDisplayConfig;
  // Per-section custom title overrides
  sectionTitles?: Partial<Record<Page2SectionKey, string>>;
  // Sub-section title overrides (e.g. "BACKGROUND KNOWLEDGE" inside visual_summary)
  subSectionTitles?: Partial<Record<string, string>>;
  // Sub-section color overrides (e.g. background knowledge header/body bg)
  subSectionColors?: Partial<Record<string, string>>;
  // Section number badge config (text, colors, font)
  sectionBadgeConfig?: {
    handout?: SectionBadgeConfig;
    workbook?: SectionBadgeConfig;
  };
}

export interface SectionBadgeConfig {
  label?: string;         // default "01" / "02"
  textColor?: string;     // default "#FFFFFF"
  bgColor?: string;       // default theme primary (empty = theme)
  fontFamily?: FontFamily | "";  // "" = use default Impact
  fontSize?: number;      // px, default = fontSizes.passageNumber + 18
}

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  academyName: null,
  logoBase64: null,
  avatarBase64: null,
  page2Sections: ["visual_summary", "topic", "summary", "flow", "vocabulary"],
  themePreset: "purple",
  defaultHeaderText: null,
  defaultAnalysisTitle: null,
  defaultSummaryTitle: null,
  fontScale: "medium",
  fontFamily: "pretendard",
  titleWeight: "bold",
  fontSizes: FONT_SIZE_PRESETS.medium,
};

export const DEFAULT_SECTION_TITLES: Record<BuiltInSectionKey, string> = {
  visual_summary: "VISUAL SUMMARY",
  topic: "주제",
  summary: "요약",
  flow: "내용 정리",
  vocabulary: "핵심 어휘",
};

export const VALID_PAGE2_SECTIONS: ReadonlySet<BuiltInSectionKey> = new Set([
  "visual_summary",
  "topic",
  "summary",
  "flow",
  "vocabulary",
]);

export const PAGE2_SECTION_LABELS: Record<BuiltInSectionKey, string> = {
  visual_summary: "삽화 요약",
  topic: "주제문",
  summary: "요약",
  flow: "내용 정리",
  vocabulary: "핵심 어휘",
};
