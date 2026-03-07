"use client";

import { useState, useRef } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { resizeImageToBase64 } from "@/lib/imageResize";
import { useConfirm } from "@/components/ui/ConfirmModal";

export function useTemplateSettingsPanel() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'info' | 'error'>('error');
  const [showFontDetail, setShowFontDetail] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { confirm } = useConfirm();
  const setLogoBase64 = useTemplateSettingsStore((s) => s.setLogoBase64);
  const setAvatarBase64 = useTemplateSettingsStore((s) => s.setAvatarBase64);
  const resetToDefaults = useTemplateSettingsStore((s) => s.resetToDefaults);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setLogoBase64(base64);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "로고 업로드 실패");
      setTimeout(() => setSaveMessage(null), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setAvatarBase64(base64);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "이미지 업로드 실패");
      setTimeout(() => setSaveMessage(null), 3000);
    }
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const s = useTemplateSettingsStore.getState();
      const res = await fetch("/api/template-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academyName: s.academyName, logoBase64: s.logoBase64, avatarBase64: s.avatarBase64,
          page2Sections: s.page2Sections, themePreset: s.themePreset,
          defaultHeaderText: s.defaultHeaderText, defaultAnalysisTitle: s.defaultAnalysisTitle,
          defaultSummaryTitle: s.defaultSummaryTitle, fontScale: s.fontScale,
          fontFamily: s.fontFamily, titleWeight: s.titleWeight, fontSizes: s.fontSizes,
          page1Layout: s.page1Layout, headerStyle: s.headerStyle, headerBadgeStyle: s.headerBadgeStyle,
          page1BodyStyle: s.page1BodyStyle, page2HeaderStyle: s.page2HeaderStyle,
          sectionStyles: s.sectionStyles,
          vocabColumnLayout: s.vocabColumnLayout, customThemeColors: s.customThemeColors,
          useCustomTheme: s.useCustomTheme,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? "저장 실패");
      }
      setSaveMessage("저장 완료!");
      setSaveMessageType("success");
      const saved = useTemplateSettingsStore.getState();
      saved.setLastSavedSnapshot({
        academyName: saved.academyName,
        logoBase64: saved.logoBase64,
        avatarBase64: saved.avatarBase64,
        page2Sections: saved.page2Sections,
        themePreset: saved.themePreset,
        defaultHeaderText: saved.defaultHeaderText,
        defaultAnalysisTitle: saved.defaultAnalysisTitle,
        defaultSummaryTitle: saved.defaultSummaryTitle,
        fontScale: saved.fontScale,
        fontFamily: saved.fontFamily,
        titleWeight: saved.titleWeight,
        fontSizes: saved.fontSizes,
        page1Layout: saved.page1Layout,
        headerStyle: saved.headerStyle,
        headerBadgeStyle: saved.headerBadgeStyle,
        page1BodyStyle: saved.page1BodyStyle,
        page2HeaderStyle: saved.page2HeaderStyle,
        sectionStyles: saved.sectionStyles,
        vocabColumnLayout: saved.vocabColumnLayout,
        customThemeColors: saved.customThemeColors,
        useCustomTheme: saved.useCustomTheme,
      });
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleResetToDefaults() {
    const ok = await confirm({
      title: "기본값으로 초기화",
      message: "모든 설정이 기본값으로 초기화됩니다. 계속할까요?",
      confirmLabel: "초기화",
      variant: "danger",
    });
    if (!ok) return;
    resetToDefaults();
    setSaveMessageType("info");
    setSaveMessage("기본값으로 초기화했습니다. 저장 버튼을 눌러 적용하세요.");
    setTimeout(() => setSaveMessage(null), 5000);
  }

  return {
    isSaving, saveMessage, saveMessageType,
    showFontDetail, setShowFontDetail,
    openGroup, setOpenGroup,
    fileInputRef, avatarInputRef,
    handleLogoUpload, handleAvatarUpload, handleSave, handleResetToDefaults,
  };
}
