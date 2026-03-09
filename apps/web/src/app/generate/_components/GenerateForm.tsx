"use client";

import DuplicateWarningModal from "@/components/DuplicateWarningModal";
import GenerateGuideModal from "@/components/GenerateGuideModal";
import GenerateInputPanel from "./GenerateInputPanel";
import GenerateOptionsPanel from "./GenerateOptionsPanel";
import GenerateSubmitSection from "./GenerateSubmitSection";
import type { GenerateFormProps } from "./generateForm.types";

export default function GenerateForm({
  inputMode,
  textBlock,
  cards,
  contentLevel,
  modelTier,
  options,
  isSubmitting,
  isGuideOpen,
  duplicates,
  showDuplicateModal,
  passageCount,
  limitError,
  isSubmitDisabled,
  onTextBlockChange,
  onContentLevelChange,
  onModelTierChange,
  onOptionsChange,
  onGuideOpenChange,
  onToggleMode,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  onSubmit,
  onDuplicateProceed,
  onDuplicateClose,
}: GenerateFormProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 pb-28 space-y-10 sm:space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          교안 생성
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          영어 지문을 입력하면 맞춤 교안을 자동으로 생성합니다. <br className="hidden sm:block" />
          교육자를 위한 프리미엄 교안 제작 도구.
        </p>
      </div>

      <GenerateInputPanel
        inputMode={inputMode}
        textBlock={textBlock}
        cards={cards}
        passageCount={passageCount}
        onTextBlockChange={onTextBlockChange}
        onToggleMode={onToggleMode}
        onAddCard={onAddCard}
        onUpdateCard={onUpdateCard}
        onRemoveCard={onRemoveCard}
      />

      <GenerateOptionsPanel
        contentLevel={contentLevel}
        modelTier={modelTier}
        options={options}
        onContentLevelChange={onContentLevelChange}
        onModelTierChange={onModelTierChange}
        onOptionsChange={onOptionsChange}
        onGuideOpen={() => onGuideOpenChange(true)}
      />

      <GenerateSubmitSection
        passageCount={passageCount}
        contentLevel={contentLevel}
        modelTier={modelTier}
        limitError={limitError}
        isSubmitDisabled={isSubmitDisabled}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />

      <GenerateGuideModal isOpen={isGuideOpen} onClose={() => onGuideOpenChange(false)} />
      <DuplicateWarningModal
        open={showDuplicateModal}
        duplicates={duplicates}
        onClose={onDuplicateClose}
        onProceed={onDuplicateProceed}
      />
    </div>
  );
}
