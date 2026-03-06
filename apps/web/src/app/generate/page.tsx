"use client";

import GenerateForm from "./_components/GenerateForm";
import { useGenerateForm } from "./_hooks/useGenerateForm";

export default function GeneratePage() {
  const form = useGenerateForm();

  return (
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
  );
}
