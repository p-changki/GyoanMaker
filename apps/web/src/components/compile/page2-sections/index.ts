import type { Page2SectionKey } from "@gyoanmaker/shared/types";
import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { TopicSection } from "./TopicSection";
import { SummarySection } from "./SummarySection";
import { FlowSection } from "./FlowSection";
import { VocabularySection } from "./VocabularySection";

export { TopicSection, SummarySection, FlowSection, VocabularySection };

export const SECTION_COMPONENTS: Record<
  Page2SectionKey,
  React.ComponentType<{ section: HandoutSection }>
> = {
  topic: TopicSection,
  summary: SummarySection,
  flow: FlowSection,
  vocabulary: VocabularySection,
};
