"use client";

import { useTemplateSettingsPanel } from "./useTemplateSettingsPanel";
import BrandingSection from "./BrandingSection";
import DefaultTextsSection from "./DefaultTextsSection";
import ThemeSection from "./ThemeSection";
import FontSettingsSection from "./FontSettingsSection";
import FontSizeDetailView from "./FontSizeDetailView";
import SectionConfigPanel from "./SectionConfigPanel";
import SaveControls from "./SaveControls";

export default function TemplateSettingsPanel() {
  const {
    isSaving, saveMessage,
    showFontDetail, setShowFontDetail,
    fileInputRef, avatarInputRef,
    handleLogoUpload, handleAvatarUpload, handleSave, handleResetToDefaults,
  } = useTemplateSettingsPanel();

  if (showFontDetail) {
    return <FontSizeDetailView onBack={() => setShowFontDetail(false)} />;
  }

  return (
    <div className="space-y-5">
      <BrandingSection
        fileInputRef={fileInputRef}
        avatarInputRef={avatarInputRef}
        onLogoUpload={handleLogoUpload}
        onAvatarUpload={handleAvatarUpload}
      />
      <DefaultTextsSection />
      <ThemeSection />
      <FontSettingsSection onOpenDetail={() => setShowFontDetail(true)} />
      <SectionConfigPanel />
      <SaveControls
        isSaving={isSaving}
        saveMessage={saveMessage}
        onSave={handleSave}
        onReset={handleResetToDefaults}
      />
    </div>
  );
}
