"use client";

import { useState, type RefObject } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { removeBackground } from "@/lib/removeBackground";
import { DEFAULT_IMAGE_DISPLAY } from "@gyoanmaker/shared/types";

interface BrandingSectionProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function RemoveBgButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-[10px] text-gray-400 hover:text-[#5E35B1] transition-colors disabled:opacity-50 flex items-center gap-0.5"
    >
      {loading ? (
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
  );
}

function ImageAdjustSliders({
  label,
  scale,
  offsetX,
  offsetY,
  onChangeScale,
  onChangeOffsetX,
  onChangeOffsetY,
}: {
  label: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  onChangeScale: (v: number) => void;
  onChangeOffsetX: (v: number) => void;
  onChangeOffsetY: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5 mt-2">
      <p className="text-[9px] font-bold text-gray-400 uppercase">{label} 조정</p>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">크기</span>
        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={Math.round(scale * 100)}
          onChange={(e) => onChangeScale(Number(e.target.value) / 100)}
          className="flex-1 h-1 accent-[#5E35B1]"
        />
        <span className="text-[9px] text-gray-500 w-8 text-right">{Math.round(scale * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">좌우</span>
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={offsetX}
          onChange={(e) => onChangeOffsetX(Number(e.target.value))}
          className="flex-1 h-1 accent-[#5E35B1]"
        />
        <span className="text-[9px] text-gray-500 w-8 text-right">{offsetX}px</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">상하</span>
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={offsetY}
          onChange={(e) => onChangeOffsetY(Number(e.target.value))}
          className="flex-1 h-1 accent-[#5E35B1]"
        />
        <span className="text-[9px] text-gray-500 w-8 text-right">{offsetY}px</span>
      </div>
    </div>
  );
}

export default function BrandingSection({ fileInputRef, avatarInputRef, onLogoUpload, onAvatarUpload }: BrandingSectionProps) {
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const setLogoBase64 = useTemplateSettingsStore((s) => s.setLogoBase64);
  const avatarBase64 = useTemplateSettingsStore((s) => s.avatarBase64);
  const setAvatarBase64 = useTemplateSettingsStore((s) => s.setAvatarBase64);
  const logoDisplay = useTemplateSettingsStore((s) => s.logoDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const avatarDisplay = useTemplateSettingsStore((s) => s.avatarDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const setLogoDisplay = useTemplateSettingsStore((s) => s.setLogoDisplay);
  const setAvatarDisplay = useTemplateSettingsStore((s) => s.setAvatarDisplay);
  const [removingLogoBg, setRemovingLogoBg] = useState(false);
  const [removingAvatarBg, setRemovingAvatarBg] = useState(false);

  async function handleRemoveLogoBg() {
    if (!logoBase64 || removingLogoBg) return;
    setRemovingLogoBg(true);
    try {
      const result = await removeBackground(logoBase64);
      setLogoBase64(result);
    } catch {
      // silently fail — user can retry
    } finally {
      setRemovingLogoBg(false);
    }
  }

  async function handleRemoveAvatarBg() {
    if (!avatarBase64 || removingAvatarBg) return;
    setRemovingAvatarBg(true);
    try {
      const result = await removeBackground(avatarBase64);
      setAvatarBase64(result);
    } catch {
      // silently fail — user can retry
    } finally {
      setRemovingAvatarBg(false);
    }
  }

  return (
    <>
      {/* Academy Branding */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          학원 브랜딩
        </p>
        <div className="flex items-center gap-3">
          {logoBase64 ? (
            <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoBase64} alt="로고" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setLogoBase64(null)}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center leading-none"
              >
                x
              </button>
              {removingLogoBg && (
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
            {logoBase64 && <RemoveBgButton onClick={handleRemoveLogoBg} loading={removingLogoBg} />}
            <p className="text-[9px] text-gray-400 mt-0.5">120x120px, 200KB 이하</p>
          </div>
        </div>
        {logoBase64 && (
          <ImageAdjustSliders
            label="로고"
            scale={logoDisplay.scale}
            offsetX={logoDisplay.offsetX}
            offsetY={logoDisplay.offsetY}
            onChangeScale={(v) => setLogoDisplay({ scale: v })}
            onChangeOffsetX={(v) => setLogoDisplay({ offsetX: v })}
            onChangeOffsetY={(v) => setLogoDisplay({ offsetY: v })}
          />
        )}
      </div>

      {/* Character Avatar */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          캐릭터 이미지
        </p>
        <div className="flex items-center gap-3">
          {avatarBase64 ? (
            <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarBase64} alt="캐릭터" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setAvatarBase64(null)}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center leading-none"
              >
                x
              </button>
              {removingAvatarBg && (
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
              <img src="/images/avatar.png" alt="기본" className="w-full h-full object-contain opacity-50" />
            </div>
          )}
          <div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
            <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-xs font-bold text-[#5E35B1] hover:underline">
              {avatarBase64 ? "변경" : "이미지 업로드"}
            </button>
            {avatarBase64 && <RemoveBgButton onClick={handleRemoveAvatarBg} loading={removingAvatarBg} />}
            <p className="text-[9px] text-gray-400 mt-0.5">90x90px, 200KB 이하 (미설정 시 기본)</p>
          </div>
        </div>
        {avatarBase64 && (
          <ImageAdjustSliders
            label="캐릭터"
            scale={avatarDisplay.scale}
            offsetX={avatarDisplay.offsetX}
            offsetY={avatarDisplay.offsetY}
            onChangeScale={(v) => setAvatarDisplay({ scale: v })}
            onChangeOffsetX={(v) => setAvatarDisplay({ offsetX: v })}
            onChangeOffsetY={(v) => setAvatarDisplay({ offsetY: v })}
          />
        )}
      </div>
    </>
  );
}
