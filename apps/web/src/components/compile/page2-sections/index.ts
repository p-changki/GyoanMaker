import type { BuiltInSectionKey } from "@gyoanmaker/shared/types";
import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { TopicSection } from "./TopicSection";
import { SummarySection } from "./SummarySection";
import { FlowSection } from "./FlowSection";
import { VocabularySection } from "./VocabularySection";
import { VisualSummarySection } from "./VisualSummarySection";

export {
  VisualSummarySection,
  TopicSection,
  SummarySection,
  FlowSection,
  VocabularySection,
};
export { CustomSection } from "./CustomSection";

export const BUILTIN_SECTION_COMPONENTS: Record<
  BuiltInSectionKey,
  React.ComponentType<{ section: HandoutSection }>
> = {
  visual_summary: VisualSummarySection,
  topic: TopicSection,
  summary: SummarySection,
  flow: FlowSection,
  vocabulary: VocabularySection,
};
