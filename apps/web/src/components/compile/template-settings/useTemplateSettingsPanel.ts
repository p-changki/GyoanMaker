"use client";

import { useState, useRef } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { resizeImageToBase64 } from "@/lib/imageResize";
import { useConfirm } from "@/components/ui/ConfirmModal";

export function useTemplateSettingsPanel() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
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
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? "저장 실패");
      }
      setSaveMessage("저장 완료!");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleResetToDefaults() {
    const ok = await confirm({
      title: "Reset to Defaults",
      message: "All settings will be reset to defaults. Continue?",
      confirmLabel: "Reset",
      variant: "danger",
    });
    if (!ok) return;
    resetToDefaults();
    setSaveMessage("Reset to defaults. Press Save to apply changes to server.");
    setTimeout(() => setSaveMessage(null), 5000);
  }

  return {
    isSaving, saveMessage,
    showFontDetail, setShowFontDetail,
    openGroup, setOpenGroup,
    fileInputRef, avatarInputRef,
    handleLogoUpload, handleAvatarUpload, handleSave, handleResetToDefaults,
  };
}
