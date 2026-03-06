"use client";

export default function EmptyHandoutView({
  id,
  rawText,
}: {
  id: string;
  rawText?: string;
}) {
  return (
    <div className="p-16 flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="w-24 h-24 bg-[#F9FAFB] rounded-3xl flex items-center justify-center text-3xl font-black text-[#E5E7EB] border-2 border-dashed border-[#E5E7EB]">
        {id}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-[#9CA3AF] tracking-tight">
          지문 내용을 기다리는 중
        </h3>
        <p className="text-sm text-[#D1D5DB] font-bold max-w-sm">
          우측 상단의 [템플릿 적용] 버튼을 눌러 교안을 완성해주세요.
        </p>
      </div>

      {rawText && (
        <div className="w-full mt-10 p-6 bg-[#F9FAFB]/50 rounded-2xl border border-[#F3F4F6] text-left overflow-hidden opacity-30 select-none">
          <p className="text-[10px] text-[#9CA3AF] font-mono line-clamp-6">{rawText}</p>
        </div>
      )}
    </div>
  );
}
