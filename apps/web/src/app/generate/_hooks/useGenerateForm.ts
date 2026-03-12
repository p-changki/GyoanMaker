"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hashPassages } from "@/services/cache";
import {
  splitTextBlockIntoPassages,
  passagesToCards,
  cardsToPassages,
  passagesToTextBlock,
  validatePassageLimits,
  type PassageLimitError,
} from "@/lib/parsePassages";
import {
  InputMode,
  PassageInput as PassageInputType,
  ContentLevel,
  ModelTier,
  OutputOptionState,
} from "@gyoanmaker/shared/types";

const SESSION_STORAGE_KEY = "gyoanmaker:input";

interface DuplicateItem {
  id: string;
  title: string;
  passageCount: number;
  createdAt: string;
}

export function useGenerateForm() {
  const router = useRouter();

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textBlock, setTextBlock] = useState("");
  const [cards, setCards] = useState<PassageInputType[]>([]);
  const [contentLevel, setContentLevel] = useState<ContentLevel>("advanced");
  const [modelTier, setModelTier] = useState<ModelTier>("pro");
  const [vocabCount, setVocabCount] = useState<"standard" | "extended">("standard");
  const [options, setOptions] = useState<OutputOptionState>({
    copyBlock: true,
    pdf: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const pendingSubmitRef = useRef(false);

  const finalPassages = useMemo(() => {
    if (inputMode === "text") {
      return splitTextBlockIntoPassages(textBlock);
    }
    return cardsToPassages(cards);
  }, [inputMode, textBlock, cards]);

  const passageCount = finalPassages.length;

  const limitError: PassageLimitError | null = useMemo(
    () => validatePassageLimits(finalPassages),
    [finalPassages]
  );

  const isSubmitDisabled =
    passageCount === 0 || passageCount > 20 || limitError !== null;

  const handleToggleMode = useCallback(
    (mode: InputMode) => {
      if (mode === inputMode) return;

      if (mode === "cards") {
        const passages = splitTextBlockIntoPassages(textBlock);
        setCards(passagesToCards(passages));
      } else {
        const passages = cardsToPassages(cards);
        setTextBlock(passagesToTextBlock(passages));
      }
      setInputMode(mode);
    },
    [cards, inputMode, textBlock]
  );

  const handleAddCard = useCallback(() => {
    if (cards.length >= 20) return;
    const newId = `p${String(cards.length + 1).padStart(2, "0")}`;
    setCards([...cards, { id: newId, text: "" }]);
  }, [cards]);

  const handleUpdateCard = useCallback(
    (index: number, text: string) => {
      const newCards = [...cards];
      newCards[index] = { ...newCards[index], text };
      setCards(newCards);
    },
    [cards]
  );

  const handleRemoveCard = useCallback(
    (index: number) => {
      const newCards = cards.filter((_, i) => i !== index);
      setCards(newCards);
    },
    [cards]
  );

  const proceedToGenerate = useCallback(() => {
    const payload = {
      inputMode,
      passages: finalPassages,
      options,
      level: contentLevel,
      model: modelTier,
      vocabCount,
      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    router.push("/results");
  }, [contentLevel, finalPassages, inputMode, modelTier, options, router, vocabCount]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitDisabled || isSubmitting || pendingSubmitRef.current) return;

    setIsSubmitting(true);
    pendingSubmitRef.current = true;

    try {
      const hash = await hashPassages(finalPassages);
      const res = await fetch("/api/handouts/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputHash: hash }),
      });

      if (res.ok) {
        const data = (await res.json()) as { duplicates: DuplicateItem[] };

        if (data.duplicates.length > 0) {
          setDuplicates(data.duplicates);
          setShowDuplicateModal(true);
          setIsSubmitting(false);
          pendingSubmitRef.current = false;
          return;
        }
      }
    } catch {
      // check failed — proceed anyway
    }

    pendingSubmitRef.current = false;
    proceedToGenerate();
  }, [finalPassages, isSubmitDisabled, isSubmitting, proceedToGenerate]);

  const handleDuplicateProceed = useCallback(() => {
    setShowDuplicateModal(false);
    setDuplicates([]);
    proceedToGenerate();
  }, [proceedToGenerate]);

  const handleDuplicateClose = useCallback(() => {
    setShowDuplicateModal(false);
    setDuplicates([]);
    setIsSubmitting(false);
    pendingSubmitRef.current = false;
  }, []);

  return {
    inputMode,
    textBlock,
    cards,
    contentLevel,
    modelTier,
    vocabCount,
    options,
    isSubmitting,
    isGuideOpen,
    duplicates,
    showDuplicateModal,
    passageCount,
    limitError,
    isSubmitDisabled,
    setTextBlock,
    setContentLevel,
    setModelTier,
    setVocabCount,
    setOptions,
    setIsGuideOpen,
    handleToggleMode,
    handleAddCard,
    handleUpdateCard,
    handleRemoveCard,
    handleSubmit,
    handleDuplicateProceed,
    handleDuplicateClose,
  };
}
