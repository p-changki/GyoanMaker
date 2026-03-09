"use client";

import { useEffect, useRef, useState } from "react";

export const GUIDE_DISMISSED_KEY = "gyoanmaker:template-guide-dismissed";

interface TemplateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateGuideModal({
  isOpen,
  onClose,
}: TemplateGuideModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleDismiss();
    }
  };

  function handleDismiss() {
    if (dontShowAgain) {
      localStorage.setItem(GUIDE_DISMISSED_KEY, "true");
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-sm bg-transparent p-4 m-auto max-w-2xl w-full"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            교안 편집 가이드
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>닫기</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Step 1: Overview */}
          <section className="space-y-3">
            <SectionHeader
              icon={<OverviewIcon />}
              title="교안 만들기 3단계"
            />
            <div className="grid grid-cols-3 gap-2">
              <StepCard
                step="1"
                label="템플릿 적용"
                desc="AI 분석 결과를 교안 형식으로 변환합니다."
                color="purple"
              />
              <StepCard
                step="2"
                label="편집"
                desc="미리보기에서 제목, 내용을 직접 수정합니다."
                color="blue"
              />
              <StepCard
                step="3"
                label="PDF 다운로드"
                desc="완성된 교안을 PDF로 내보냅니다."
                color="emerald"
              />
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Step 2: Actions Tab */}
          <section className="space-y-3">
            <SectionHeader
              icon={<TabIcon label="실행" />}
              title="실행 탭 — 교안 생성 & 내보내기"
            />
            <div className="space-y-2">
              <FeatureRow
                badge="교안 템플릿 적용"
                badgeColor="bg-[#5E35B1] text-white"
                desc="AI 분석 결과 20개를 교안 레이아웃으로 변환합니다. 이 버튼을 먼저 눌러주세요."
              />
              <FeatureRow
                badge="교안 저장"
                badgeColor="bg-white border border-gray-200 text-gray-700"
                desc="현재 교안을 교안 저장소에 저장합니다. 나중에 다시 불러올 수 있습니다."
              />
              <FeatureRow
                badge="전체 복사 / TXT 다운로드"
                badgeColor="bg-white border border-gray-200 text-gray-700"
                desc="교안 텍스트를 클립보드에 복사하거나 TXT 파일로 다운로드합니다."
              />
              <FeatureRow
                badge="PDF 다운로드"
                badgeColor="bg-gray-50 border border-dashed border-gray-300 text-gray-500"
                desc="최종 교안을 PDF 파일로 내보냅니다. 파일명을 직접 지정할 수도 있습니다."
              />
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Step 3: Settings Tab */}
          <section className="space-y-3">
            <SectionHeader
              icon={<TabIcon label="설정" />}
              title="설정 탭 — 교안 디자인 커스터마이징"
            />
            <div className="space-y-2">
              <SettingRow emoji="🏫" title="브랜딩" desc="학원 로고와 캐릭터 이미지를 업로드합니다. 교안 상단과 2페이지에 표시됩니다." />
              <SettingRow emoji="🎨" title="테마" desc="5가지 색상 프리셋(퍼플/블루/그린/블랙/화이트) 중 선택하거나, 커스텀 색상을 직접 지정할 수 있습니다." />
              <SettingRow emoji="🔤" title="폰트" desc="11종 글꼴(프리텐다드/나눔고딕/지마켓산스/KoPub돋움체/Times New Roman 등), 크기, 제목 굵기를 조절합니다." />
              <SettingRow emoji="📋" title="섹션 구성" desc="2페이지의 섹션(주제문, 요약, 흐름, 어휘)을 드래그로 순서 변경하거나 숨길 수 있습니다. 커스텀 텍스트 섹션을 최대 5개까지 추가할 수도 있습니다." />
              <SettingRow emoji="✏️" title="커스텀 섹션" desc="'+ 섹션 추가' 버튼으로 나만의 텍스트 섹션을 만들 수 있습니다. 제목과 본문을 자유롭게 입력하고, 스타일도 개별 설정 가능합니다." />
              <SettingRow emoji="📊" title="어휘 레이아웃" desc="어휘 표를 2열/3열/4열 중 선택하고, 유의어·반의어 열을 개별적으로 표시하거나 숨길 수 있습니다." />
              <SettingRow emoji="🌐" title="요약 언어" desc="요약 섹션에서 영어+한국어, 영어만, 한국어만 중 표시할 언어를 선택할 수 있습니다." />
              <SettingRow emoji="🖌️" title="섹션별 스타일" desc="각 섹션의 배경색, 제목색, 텍스트색, 여백, 구분선을 개별 조절할 수 있습니다." />
              <SettingRow emoji="📐" title="1페이지 레이아웃" desc="영어 컬럼 비율, 번호 스타일(01/1/①), 테이블 테두리 두께를 설정합니다. 문장 번호와 한국어 열의 표시/숨김도 토글할 수 있습니다." />
              <SettingRow emoji="↔️" title="텍스트 정렬" desc="각 섹션별로 텍스트를 왼쪽/가운데/오른쪽으로 정렬할 수 있습니다." />
              <SettingRow emoji="🧑‍🏫" title="아바타 설정" desc="2페이지 요약바의 캐릭터 위치, 크기를 조절하고, 레이어(앞/뒤)를 전환하여 바 위 또는 뒤에 배치할 수 있습니다. 기본 캐릭터와 업로드 이미지 모두 지원합니다." />
              <SettingRow emoji="🖼️" title="Visual Summary" desc="일러스트와 내용 정리가 2컬럼 레이아웃으로 나란히 표시됩니다. 내용 정리 항목의 배경색도 개별 설정 가능합니다." />
              <SettingRow emoji="🔠" title="추가 폰트" desc="지마켓산스 Bold/Medium, KoPub돋움체, Times New Roman 등 11종의 폰트를 섹션별로 선택할 수 있습니다." />
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Step 4: Save System */}
          <section className="space-y-3">
            <SectionHeader
              icon={<SaveIcon />}
              title="설정 저장 시스템"
            />
            <div className="space-y-2">
              <SaveRow
                label="기본 설정으로 저장"
                variant="primary"
                desc="현재 설정을 기본값으로 저장합니다. 다음에 새 교안을 만들 때 이 설정이 자동으로 적용됩니다."
              />
              <SaveRow
                label="+ 템플릿으로 저장"
                variant="outline"
                desc="현재 설정에 이름을 붙여 템플릿 갤러리에 보관합니다. 필요할 때 골라서 적용할 수 있습니다."
              />
              <SaveRow
                label="기본값으로 초기화"
                variant="ghost"
                desc="모든 설정을 처음 상태로 되돌립니다. 초기화 후 '기본 설정으로 저장'을 눌러야 서버에 반영됩니다."
              />
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Step 5: Inline Edit */}
          <section className="space-y-3">
            <SectionHeader
              icon={<PencilIcon />}
              title="인라인 편집"
            />
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
              <p className="text-xs text-gray-700 leading-relaxed">
                미리보기 영역에서 <strong>헤더 텍스트</strong>, <strong>분석 제목</strong>, <strong>요약 제목</strong>을
                직접 클릭하면 편집할 수 있습니다.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200 text-[10px] font-medium">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>편집 힌트</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  연필 아이콘
                </span>
                <span>마우스를 올리면 편집 가능한 영역에 연필 아이콘이 나타납니다.</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#5E35B1] focus:ring-[#5E35B1] cursor-pointer"
            />
            <span className="text-xs text-gray-500">다시 보지 않기</span>
          </label>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#5E35B1] hover:bg-[#4527A0] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* ── Sub-components ── */

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
    </div>
  );
}

function StepCard({ step, label, desc, color }: { step: string; label: string; desc: string; color: string }) {
  const styles: Record<string, string> = {
    purple: "bg-purple-50/50 border-purple-100",
    blue: "bg-blue-50/50 border-blue-100",
    emerald: "bg-emerald-50/50 border-emerald-100",
  };
  const badges: Record<string, string> = {
    purple: "bg-purple-600",
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
  };
  return (
    <div className={`p-3 rounded-xl ${styles[color]} border space-y-1.5`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-5 h-5 rounded-full ${badges[color]} text-white text-[10px] font-black flex items-center justify-center`}>
          {step}
        </span>
        <span className="text-xs font-bold text-gray-800">{label}</span>
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function TabIcon({ label }: { label: string }) {
  return (
    <div className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
      <span className="text-[10px] font-bold text-gray-600">{label}</span>
    </div>
  );
}

function FeatureRow({ badge, badgeColor, desc }: { badge: string; badgeColor: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/70">
      <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${badgeColor}`}>
        {badge}
      </span>
      <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{desc}</p>
    </div>
  );
}

function SettingRow({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/70">
      <span className="text-base mt-0.5 shrink-0">{emoji}</span>
      <div>
        <p className="text-xs font-bold text-gray-800">{title}</p>
        <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function SaveRow({ label, variant, desc }: { label: string; variant: "primary" | "outline" | "ghost"; desc: string }) {
  const styles: Record<string, string> = {
    primary: "bg-[#5E35B1] text-white",
    outline: "bg-white border border-[#5E35B1] text-[#5E35B1]",
    ghost: "bg-white border border-gray-300 text-gray-500",
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/70">
      <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${styles[variant]}`}>
        {label}
      </span>
      <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{desc}</p>
    </div>
  );
}

function OverviewIcon() {
  return (
    <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>개요</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
  );
}

function SaveIcon() {
  return (
    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>저장</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    </div>
  );
}

function PencilIcon() {
  return (
    <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>편집</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </div>
  );
}
