"use client";

import type { RefObject } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

interface BrandingSectionProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BrandingSection({ fileInputRef, avatarInputRef, onLogoUpload, onAvatarUpload }: BrandingSectionProps) {
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const setLogoBase64 = useTemplateSettingsStore((s) => s.setLogoBase64);
  const avatarBase64 = useTemplateSettingsStore((s) => s.avatarBase64);
  const setAvatarBase64 = useTemplateSettingsStore((s) => s.setAvatarBase64);

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
            <p className="text-[9px] text-gray-400 mt-0.5">120x120px, 200KB 이하</p>
          </div>
        </div>
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
            <p className="text-[9px] text-gray-400 mt-0.5">90x90px, 200KB 이하 (미설정 시 기본)</p>
          </div>
        </div>
      </div>
    </>
  );
}
