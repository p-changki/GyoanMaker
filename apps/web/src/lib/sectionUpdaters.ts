import type { HandoutSection } from "@gyoanmaker/shared/types";

/** Update a sentence's en or ko text */
export function updateSentenceText(
  section: HandoutSection,
  index: number,
  field: "en" | "ko",
  value: string,
): HandoutSection {
  return {
    ...section,
    sentences: section.sentences.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    ),
  };
}

/** Update topic sentence en or ko */
export function updateTopicText(
  section: HandoutSection,
  field: "en" | "ko",
  value: string,
): HandoutSection {
  return {
    ...section,
    topic: { ...section.topic, [field]: value },
  };
}

/** Update summary en or ko */
export function updateSummaryText(
  section: HandoutSection,
  field: "en" | "ko",
  value: string,
): HandoutSection {
  return {
    ...section,
    summary: { ...section.summary, [field]: value },
  };
}

/** Update a flow item's text */
export function updateFlowText(
  section: HandoutSection,
  index: number,
  value: string,
): HandoutSection {
  return {
    ...section,
    flow: section.flow.map((f, i) =>
      i === index ? { ...f, text: value } : f,
    ),
  };
}

/** Update a vocab item's word or meaning */
export function updateVocabField(
  section: HandoutSection,
  vocabIndex: number,
  field: "word" | "meaning",
  value: string,
): HandoutSection {
  return {
    ...section,
    vocabulary: section.vocabulary.map((v, i) =>
      i === vocabIndex ? { ...v, [field]: value } : v,
    ),
  };
}

/** Update a vocab synonym/antonym entry */
export function updateVocabRelated(
  section: HandoutSection,
  vocabIndex: number,
  type: "synonyms" | "antonyms",
  relatedIndex: number,
  field: "word" | "meaning",
  value: string,
): HandoutSection {
  return {
    ...section,
    vocabulary: section.vocabulary.map((v, i) =>
      i === vocabIndex
        ? {
            ...v,
            [type]: v[type].map((r, ri) =>
              ri === relatedIndex ? { ...r, [field]: value } : r,
            ),
          }
        : v,
    ),
  };
}
