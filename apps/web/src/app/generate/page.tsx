"use client";

import { startTransition, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FreeTrialGuideModal, {
  shouldShowFreeTrialGuide,
} from "@/components/FreeTrialGuideModal";
import GenerateForm from "./_components/GenerateForm";
import { useGenerateForm } from "./_hooks/useGenerateForm";

async function fetchQuotaPlan(): Promise<string> {
  const res = await fetch("/api/quota");
  if (!res.ok) return "unknown";
  const data = (await res.json()) as { plan: string };
  return data.plan;
}

export default function GeneratePage() {
  const form = useGenerateForm();
  const [isTrialGuideOpen, setIsTrialGuideOpen] = useState(false);

  const { data: plan } = useQuery({
    queryKey: ["quota-plan"],
    queryFn: fetchQuotaPlan,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-show for free users on first visit
  useEffect(() => {
    if (plan === "free" && shouldShowFreeTrialGuide()) {
      startTransition(() => {
        setIsTrialGuideOpen(true);
      });
    }
  }, [plan]);

  return (
    <>
      <GenerateForm
        inputMode={form.inputMode}
        textBlock={form.textBlock}
        cards={form.cards}
        contentLevel={form.contentLevel}
        modelTier={form.modelTier}
        options={form.options}
        isSubmitting={form.isSubmitting}
        isGuideOpen={form.isGuideOpen}
        duplicates={form.duplicates}
        showDuplicateModal={form.showDuplicateModal}
        passageCount={form.passageCount}
        limitError={form.limitError}
        isSubmitDisabled={form.isSubmitDisabled}
        onTextBlockChange={form.setTextBlock}
        onContentLevelChange={form.setContentLevel}
        onModelTierChange={form.setModelTier}
        onOptionsChange={form.setOptions}
        onGuideOpenChange={form.setIsGuideOpen}
        onToggleMode={form.handleToggleMode}
        onAddCard={form.handleAddCard}
        onUpdateCard={form.handleUpdateCard}
        onRemoveCard={form.handleRemoveCard}
        onSubmit={form.handleSubmit}
        onDuplicateProceed={form.handleDuplicateProceed}
        onDuplicateClose={form.handleDuplicateClose}
      />
      <FreeTrialGuideModal
        isOpen={isTrialGuideOpen}
        onClose={() => setIsTrialGuideOpen(false)}
      />
    </>
  );
}
