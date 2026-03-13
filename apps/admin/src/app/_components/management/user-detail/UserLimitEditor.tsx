"use client";

interface UserLimitEditorProps {
  editFlash: string;
  editPro: string;
  editIllustration: string;
  editStorage: string;
  saving: boolean;
  saveMsg: string | null;
  onChangeFlash: (v: string) => void;
  onChangePro: (v: string) => void;
  onChangeIllustration: (v: string) => void;
  onChangeStorage: (v: string) => void;
  onSave: () => void;
}

export default function UserLimitEditor({
  editFlash,
  editPro,
  editIllustration,
  editStorage,
  saving,
  saveMsg,
  onChangeFlash,
  onChangePro,
  onChangeIllustration,
  onChangeStorage,
  onSave,
}: UserLimitEditorProps) {
  const inputClass =
    "mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            속도 한도
          </label>
          <input
            type="number"
            min="0"
            value={editFlash}
            onChange={(e) => onChangeFlash(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            정밀 한도
          </label>
          <input
            type="number"
            min="0"
            value={editPro}
            onChange={(e) => onChangePro(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            삽화 한도
          </label>
          <input
            type="number"
            min="0"
            value={editIllustration}
            onChange={(e) => onChangeIllustration(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            저장소 (빈칸=∞)
          </label>
          <input
            type="number"
            min="0"
            value={editStorage}
            onChange={(e) => onChangeStorage(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shrink-0 h-[34px]"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
      {saveMsg && (
        <p
          className={`text-xs font-medium ${
            saveMsg === "저장됨" || saveMsg === "요금제 저장됨"
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {saveMsg}
        </p>
      )}
    </div>
  );
}
