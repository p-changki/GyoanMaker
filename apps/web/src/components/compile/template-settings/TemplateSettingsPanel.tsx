"use client";

import React, { useState } from "react";
import { removeBackground } from "@/lib/removeBackground";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import { useTemplateSettingsPanel } from "./useTemplateSettingsPanel";
import BrandingSection from "./BrandingSection";
import ThemeSection from "./ThemeSection";
import FontSettingsSection from "./FontSettingsSection";
import FontSizeDetailView from "./FontSizeDetailView";
import SectionConfigPanel from "./SectionConfigPanel";
import Page1LayoutSection from "./Page1LayoutSection";
import VocabLayoutSection from "./VocabLayoutSection";
import SummaryLanguageSection from "./SummaryLanguageSection";
import UnifiedSectionEditor from "./UnifiedSectionEditor";
import TemplateGallery from "./TemplateGallery";
import SaveControls from "./SaveControls";
import { PAGE2_SECTION_LABELS, isBuiltInSectionKey, isCustomSectionKey, THEME_PRESETS, DEFAULT_SECTION_STYLE } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import type { Page2SectionKey, CustomSectionKey } from "@gyoanmaker/shared/types";
import CustomSectionPanel from "./CustomSectionPanel";

function BackButton({ label }: { label: string }) {
  const setFocus = useEditorFocusStore((s) => s.setFocus);
  return (
    <button
      type="button"
      onClick={() => setFocus("global")}
      className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors mb-4"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      전체 설정
      <span className="text-gray-300 mx-0.5">·</span>
      <span className="text-gray-600">{label}</span>
    </button>
  );
}


function AvatarSlot({
  avatarInputRef,
  onAvatarUpload,
}: {
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const avatarBase64 = useTemplateSettingsStore((s) => s.avatarBase64);
  const setAvatarBase64 = useTemplateSettingsStore((s) => s.setAvatarBase64);
  const [removingBg, setRemovingBg] = useState(false);

  async function handleRemoveBg() {
    if (!avatarBase64 || removingBg) return;
    setRemovingBg(true);
    try {
      const result = await removeBackground(avatarBase64);
      setAvatarBase64(result);
    } catch {
      // silently fail
    } finally {
      setRemovingBg(false);
    }
  }

  return (
    <>
      {avatarBase64 ? (
        <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarBase64} alt="캐릭터" width={48} height={48} className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={() => setAvatarBase64(null)}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center leading-none"
          >
            x
          </button>
          {removingBg && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-[#5E35B1]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/avatar.png" alt="기본" width={48} height={48} className="w-full h-full object-contain opacity-50" />
        </div>
      )}
      <div>
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
        <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-xs font-bold text-[#5E35B1] hover:underline">
          {avatarBase64 ? "변경" : "이미지 업로드"}
        </button>
        {avatarBase64 && (
          <button
            type="button"
            onClick={handleRemoveBg}
            disabled={removingBg}
            className="text-[10px] text-gray-400 hover:text-[#5E35B1] transition-colors disabled:opacity-50 flex items-center gap-0.5"
          >
            {removingBg ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                처리중...
              </>
            ) : (
              "배경 제거"
            )}
          </button>
        )}
        <p className="text-[9px] text-gray-400 mt-0.5">90x90px, 200KB 이하 (미설정 시 기본)</p>
      </div>
    </>
  );
}


function LogoOnlySection({
  fileInputRef,
  onLogoUpload,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const setLogoBase64 = useTemplateSettingsStore((s) => s.setLogoBase64);
  const [removingBg, setRemovingBg] = useState(false);

  async function handleRemoveBg() {
    if (!logoBase64 || removingBg) return;
    setRemovingBg(true);
    try {
      const result = await removeBackground(logoBase64);
      setLogoBase64(result);
    } catch {
      // silently fail
    } finally {
      setRemovingBg(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        학원 브랜딩
      </p>
      <div className="flex items-center gap-3">
        {logoBase64 ? (
          <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBase64} alt="로고" width={48} height={48} className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setLogoBase64(null)}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center leading-none"
            >
              x
            </button>
            {removingBg && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <svg className="w-5 h-5 animate-spin text-[#5E35B1]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs shrink-0">
            로고
          </div>
        )}
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-[#5E35B1] hover:underline">
            {logoBase64 ? "변경" : "로고 업로드"}
          </button>
          {logoBase64 && (
            <button
              type="button"
              onClick={handleRemoveBg}
              disabled={removingBg}
              className="text-[10px] text-gray-400 hover:text-[#5E35B1] transition-colors disabled:opacity-50 flex items-center gap-0.5"
            >
              {removingBg ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  처리중...
                </>
              ) : (
                "배경 제거"
              )}
            </button>
          )}
          <p className="text-[9px] text-gray-400 mt-0.5">120x120px, 200KB 이하</p>
        </div>
      </div>
    </div>
  );
}

function Page2SectionPanel({ sectionKey }: { sectionKey: Page2SectionKey }) {
  const { isSaving, saveMessage, saveMessageType, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();
  return (
    <div className="space-y-5">
      <BackButton label={isBuiltInSectionKey(sectionKey) ? PAGE2_SECTION_LABELS[sectionKey] : "커스텀"} />
      <UnifiedSectionEditor sectionKey={sectionKey} />
      {sectionKey === "vocabulary" && <VocabLayoutSection />}
      {sectionKey === "summary" && <SummaryLanguageSection />}
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



function HeaderPanel() {
  const { isSaving, saveMessage, saveMessageType, fileInputRef, handleLogoUpload, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();
  return (
    <div className="space-y-5">
      <BackButton label="헤더" />
      <LogoOnlySection fileInputRef={fileInputRef} onLogoUpload={handleLogoUpload} />
      <UnifiedSectionEditor sectionKey="header" />
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

function HeaderBadgePanel() {
  const { isSaving, saveMessage, saveMessageType, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();
  return (
    <div className="space-y-5">
      <BackButton label="헤더 배지" />
      <UnifiedSectionEditor sectionKey="headerBadge" />
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

function Page1TitlePanel() {
  const { isSaving, saveMessage, saveMessageType, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();
  const page1Style = useTemplateSettingsStore((s) => s.page1BodyStyle) ?? DEFAULT_SECTION_STYLE;
  const setPage1BodyStyle = useTemplateSettingsStore((s) => s.setPage1BodyStyle);
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const base = THEME_PRESETS[preset];
  const theme = useCustom && customColors ? { ...base, ...customColors } : base;
  const titleColor = page1Style.titleColor || theme.primary;
  const badgeBgColor = page1Style.badgeBgColor || "transparent";
  const badgeShape = page1Style.badgeShape || "rounded-full";
  const badgeFontSize = page1Style.badgeFontSize || 14;
  const badgeAlign = page1Style.badgeAlign || "left";

  return (
    <div className="space-y-5">
      <BackButton label="분석 타이틀" />

      {/* Colors */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">색상</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">테두리 / 글자 색상</span>
            <input
              type="color"
              value={titleColor}
              onChange={(e) => setPage1BodyStyle({ titleColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">배경색</span>
            <div className="flex items-center gap-2">
              {badgeBgColor !== "transparent" && (
                <button
                  type="button"
                  onClick={() => setPage1BodyStyle({ badgeBgColor: "transparent" })}
                  className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                  초기화
                </button>
              )}
              <input
                type="color"
                value={badgeBgColor === "transparent" ? "#ffffff" : badgeBgColor}
                onChange={(e) => setPage1BodyStyle({ badgeBgColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shape */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 모양</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { value: "rounded-full", label: "둥근" },
            { value: "rounded-lg", label: "약간 둥근" },
            { value: "rounded-none", label: "각진" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPage1BodyStyle({ badgeShape: opt.value })}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                badgeShape === opt.value
                  ? "bg-[#5E35B1] text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">폰트 크기</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">{badgeFontSize}px</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage1BodyStyle({ badgeFontSize: Math.max(8, badgeFontSize - 1) })}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-xs font-bold text-gray-500"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setPage1BodyStyle({ badgeFontSize: Math.min(24, badgeFontSize + 1) })}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-xs font-bold text-gray-500"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">정렬</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { value: "left", label: "왼쪽" },
            { value: "center", label: "가운데" },
            { value: "right", label: "오른쪽" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPage1BodyStyle({ badgeAlign: opt.value })}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                badgeAlign === opt.value
                  ? "bg-[#5E35B1] text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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

function Page1BodyPanel() {
  const { isSaving, saveMessage, saveMessageType, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();

  return (
    <div className="space-y-5">
      <BackButton label="문장 테이블" />
      <Page1LayoutSection />
      <UnifiedSectionEditor sectionKey="page1Body" />
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

function Page2HeaderPanel() {
  const { isSaving, saveMessage, saveMessageType, avatarInputRef, handleAvatarUpload, handleSave, handleResetToDefaults } = useTemplateSettingsPanel();
  return (
    <div className="space-y-5">
      <BackButton label="요약바" />
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          요약바 아바타 (일러스트 스타일과 별개)
        </p>
        <div className="flex items-center gap-3">
          <AvatarSlot avatarInputRef={avatarInputRef} onAvatarUpload={handleAvatarUpload} />
        </div>
      </div>
      <UnifiedSectionEditor sectionKey="page2Header" />
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

function GlobalPanel() {
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
        전체 설정 — 섹션을 클릭하면 해당 설정이 열립니다
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

const PAGE2_KEYS = new Set<Page2SectionKey>(["visual_summary", "topic", "summary", "flow", "vocabulary"]);

export default function TemplateSettingsPanel() {
  const focus = useEditorFocusStore((s) => s.focus);

  if (focus === "header") return <HeaderPanel />;
  if (focus === "header-badge") return <HeaderBadgePanel />;
  if (focus === "page1-title") return <Page1TitlePanel />;
  if (focus === "page1-body") return <Page1BodyPanel />;
  if (focus === "page2-header") return <Page2HeaderPanel />;
  if (isCustomSectionKey(focus)) return <CustomSectionPanel sectionKey={focus as CustomSectionKey} />;
  if (PAGE2_KEYS.has(focus as Page2SectionKey)) return <Page2SectionPanel sectionKey={focus as Page2SectionKey} />;
  return <GlobalPanel />;
}
