"use client";

import Image from "next/image";
import type { IllustrationSample } from "@gyoanmaker/shared/types";

interface SampleCardProps {
  sample: IllustrationSample;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function SampleCard({
  sample,
  onActivate,
  onDeactivate,
  onDelete,
  isLoading,
}: SampleCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all ${
        sample.isActive
          ? "border-[#5E35B1] ring-2 ring-[#5E35B1]/20"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {sample.isActive && (
        <div className="absolute left-2 top-2 z-10 rounded-full bg-[#5E35B1] px-2.5 py-0.5 text-[10px] font-bold text-white">
          현재 컨셉
        </div>
      )}
      {sample.isPreset && !sample.isActive && (
        <div className="absolute left-2 top-2 z-10 rounded-full bg-gray-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
          기본 제공
        </div>
      )}

      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <Image
          src={sample.imageUrl}
          alt={sample.prompt}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <div className="p-3">
        <p className="line-clamp-2 text-xs text-gray-600">{sample.prompt}</p>
        <p className="mt-1 text-[10px] text-gray-400">
          {sample.model} · {sample.quality}
        </p>

        <div className="mt-2 flex gap-1.5">
          {sample.isActive ? (
            <button
              type="button"
              onClick={() => onDeactivate(sample.sampleId)}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[#5E35B1]/30 bg-[#5E35B1]/5 px-2 py-1.5 text-[11px] font-semibold text-[#5E35B1] disabled:opacity-50"
            >
              해제
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onActivate(sample.sampleId)}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              컨셉 설정
            </button>
          )}
          {!sample.isPreset && (
            <button
              type="button"
              onClick={() => onDelete(sample.sampleId)}
              disabled={isLoading}
              className="rounded-lg border border-red-200 px-2 py-1.5 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
