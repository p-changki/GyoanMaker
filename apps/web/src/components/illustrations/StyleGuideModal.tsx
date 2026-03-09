"use client";

interface StyleGuideModalProps {
  onClose: () => void;
}

export default function StyleGuideModal({ onClose }: StyleGuideModalProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">일러스트 스타일 설정 가이드</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          일러스트 스타일을 설정하면 교안의 모든 일러스트가 일관된 화풍으로 생성됩니다.
          아래 3가지 방법 중 원하는 방식으로 시작하세요.
        </p>

        {/* Flow 1 */}
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">1</span>
            <h3 className="text-sm font-black text-gray-800">간단 모드 — 프롬프트만 입력</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">가장 빠른 방법. 원하는 스타일을 텍스트로 설명하면 AI가 생성합니다.</p>
          <ol className="space-y-1.5 text-xs text-gray-700">
            <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 1</span>상단 입력창에 원하는 화풍을 설명합니다<br/><span className="text-gray-400">예: &quot;따뜻한 수채화풍, 동화 같은 분위기&quot;</span></li>
            <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 2</span>&lsquo;스타일 테스트 생성&rsquo; 버튼을 클릭합니다</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 3</span>결과가 마음에 들면 &lsquo;저장&rsquo;하여 샘플 갤러리에 추가합니다</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 4</span>갤러리에서 원하는 샘플을 &lsquo;활성화&rsquo;하면 교안 일러스트에 적용됩니다</li>
          </ol>
        </div>

        {/* Flow 2 */}
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">2</span>
            <h3 className="text-sm font-black text-gray-800">참조 이미지 모드 — 이미지 + 프롬프트</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">원하는 화풍의 이미지를 업로드하면 AI가 해당 스타일을 분석하여 반영합니다.</p>
          <ol className="space-y-1.5 text-xs text-gray-700">
            <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 1</span>입력창 좌측의 이미지 아이콘을 클릭하여 참조 이미지를 업로드합니다</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 2</span>추가 설명을 입력합니다 (선택사항)</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 3</span>&lsquo;스타일 테스트 생성&rsquo;을 클릭합니다</li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 4</span>결과를 저장하고 갤러리에서 활성화합니다</li>
          </ol>
        </div>

        {/* Flow 3 */}
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">3</span>
            <h3 className="text-sm font-black text-gray-800">고급 모드 — 세부 스타일 직접 조정</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">스타일명, 팔레트, 선 스타일, 분위기, 캐릭터 가이드를 직접 세팅합니다.</p>
          <ol className="space-y-1.5 text-xs text-gray-700">
            <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 1</span>&lsquo;스타일 고급 설정&rsquo; 패널을 열어 세부 항목을 조정합니다</li>
            <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 2</span>&lsquo;이미지에서 스타일 추출&rsquo;로 자동 채우기도 가능합니다</li>
            <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 3</span>설정 완료 후 &lsquo;설정 저장&rsquo;을 클릭합니다</li>
            <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 4</span>상단 입력창에서 프롬프트를 입력하고 스타일 테스트를 생성합니다</li>
            <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 5</span>결과를 저장하고 갤러리에서 활성화합니다</li>
          </ol>
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 space-y-1.5">
          <p className="font-bold text-gray-700">TIP</p>
          <p>• 갤러리에서 &lsquo;활성화&rsquo;된 샘플이 교안 일러스트 생성 시 컨셉으로 사용됩니다</p>
          <p>• 교안 편집(Compile) 페이지에서 컨셉 적용 강도를 &lsquo;참고/강제&rsquo;로 조절할 수 있습니다</p>
          <p>• 여러 스타일을 테스트한 뒤 가장 마음에 드는 것을 활성화하세요</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#5E35B1] py-3 text-sm font-black text-white hover:bg-[#4A2A8F] transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}
