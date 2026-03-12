import type { PassageLimitError } from "@/lib/parsePassages";
import {
  ContentLevel,
  InputMode,
  ModelTier,
  OutputOptionState,
  PassageInput as PassageInputType,
} from "@gyoanmaker/shared/types";

export interface DuplicateItem {
  id: string;
  title: string;
  passageCount: number;
  createdAt: string;
}

export interface GenerateFormProps {
  inputMode: InputMode;
  textBlock: string;
  cards: PassageInputType[];
  contentLevel: ContentLevel;
  modelTier: ModelTier;
  vocabCount: "standard" | "extended";
  options: OutputOptionState;
  isSubmitting: boolean;
  isGuideOpen: boolean;
  duplicates: DuplicateItem[];
  showDuplicateModal: boolean;
  passageCount: number;
  limitError: PassageLimitError | null;
  isSubmitDisabled: boolean;
  onTextBlockChange: (value: string) => void;
  onContentLevelChange: (value: ContentLevel) => void;
  onModelTierChange: (value: ModelTier) => void;
  onVocabCountChange: (value: "standard" | "extended") => void;
  onOptionsChange: (value: OutputOptionState) => void;
  onGuideOpenChange: (open: boolean) => void;
  onToggleMode: (mode: InputMode) => void;
  onAddCard: () => void;
  onUpdateCard: (index: number, text: string) => void;
  onRemoveCard: (index: number) => void;
  onSubmit: () => void;
  onDuplicateProceed: () => void;
  onDuplicateClose: () => void;
}
