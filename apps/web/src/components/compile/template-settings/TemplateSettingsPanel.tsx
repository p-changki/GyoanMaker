"use client";

import { useTemplateSettingsPanel } from "./useTemplateSettingsPanel";
import BrandingSection from "./BrandingSection";
import ThemeSection from "./ThemeSection";
import FontSettingsSection from "./FontSettingsSection";
import FontSizeDetailView from "./FontSizeDetailView";
import SectionConfigPanel from "./SectionConfigPanel";
import TemplateGallery from "./TemplateGallery";
import SaveControls from "./SaveControls";

export default function TemplateSettingsPanel() {
  const {
    isSaving, saveMessage, saveMessageType,
    showFontDetail, setShowFontDetail,
    fileInputRef, avatarInputRef,
    handleLogoUpload, handleAvatarUpload, handleSave, handleResetToDefaults,
  } = useTemplateSettingsPanel();

  if (showFontDetail) {
    return <FontSizeDetailView onBack={() => setShowFontDetail(false)} />;
  }

  return (
    <div className="space-y-5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
        전체 설정 — 프리뷰에서 섹션을 클릭하면 편집 모달이 열립니다
      </p>
      <BrandingSection
        fileInputRef={fileInputRef}
        avatarInputRef={avatarInputRef}
        onLogoUpload={handleLogoUpload}
        onAvatarUpload={handleAvatarUpload}
      />
      <ThemeSection showCustomOption={true} />
      <FontSettingsSection onOpenDetail={() => setShowFontDetail(true)} />
      <SectionConfigPanel />
      <TemplateGallery />
      <SaveControls
        isSaving={isSaving}
        saveMessage={saveMessage}
        saveMessageType={saveMessageType}
        onSave={handleSave}
        onReset={handleResetToDefaults}
      />
    </div>
  );
}
