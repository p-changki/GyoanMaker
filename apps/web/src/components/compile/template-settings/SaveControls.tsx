"use client";

interface SaveControlsProps {
  isSaving: boolean;
  saveMessage: string | null;
  onSave: () => void;
  onReset: () => void;
}

export default function SaveControls({ isSaving, saveMessage, onSave, onReset }: SaveControlsProps) {
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
        className="w-full py-2.5 bg-[#5E35B1] text-white rounded-xl text-xs font-bold hover:bg-[#4527A0] disabled:opacity-50 transition-colors"
      >
        {isSaving ? "저장 중..." : "설정 저장"}
      </button>

      {saveMessage && (
        <p
          className={`text-[10px] font-medium text-center ${
            saveMessage === "저장 완료!" ? "text-emerald-600" : saveMessage.includes("초기화") ? "text-amber-600" : "text-red-500"
          }`}
        >
          {saveMessage}
        </p>
      )}
    </>
  );
}
