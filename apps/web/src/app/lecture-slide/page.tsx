import type { Metadata } from "next";
import { Suspense } from "react";
import LectureSlideOrchestrator from "./_components/LectureSlideOrchestrator";

export const metadata: Metadata = {
  title: "강의 슬라이드",
  description: "교안 데이터로 강의용 PPT 슬라이드를 자동 생성합니다.",
};

function Fallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
      <div className="h-10 w-64 animate-pulse rounded bg-gray-100" />
      <div className="h-80 w-full animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function LectureSlidePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <LectureSlideOrchestrator />
    </Suspense>
  );
}
