"use client";

import { useEffect } from "react";
import { useIsDirty } from "@/stores/useTemplateSettingsStore";

interface SaveControlsProps {
  isSaving: boolean;
  saveMessage: string | null;
  saveMessageType?: "success" | "info" | "error";
  onSave: () => void;
  onReset: () => void;
}

export default function SaveControls({
  isSaving,
  saveMessage,
  saveMessageType = "error",
  onSave,
  onReset,
}: SaveControlsProps) {
  const isDirty = useIsDirty();

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const msgColor =
    saveMessageType === "success"
      ? "text-emerald-600"
      : saveMessageType === "info"
      ? "text-amber-600"
      : "text-red-500";

  return (
    <>
      <button
        type="button"
        onClick={onReset}
        className="w-full py-2 border border-gray-300 text-gray-500 rounded-xl text-xs font-medium hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        기본값으로 초기화
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="relative w-full py-2.5 bg-[#5E35B1] text-white rounded-xl text-xs font-bold hover:bg-[#4527A0] disabled:opacity-50 transition-colors"
      >
        {isSaving ? "저장 중..." : "설정 저장"}
        {isDirty && !isSaving && (
          <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        )}
      </button>

      {saveMessage && (
        <p className={`text-[10px] font-medium text-center ${msgColor}`}>
          {saveMessage}
        </p>
      )}
    </>
  );
}
