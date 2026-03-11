import type { Metadata } from "next";
import { Suspense } from "react";
import VocaTestOrchestrator from "./_components/VocaTestOrchestrator";

export const metadata: Metadata = {
  title: "단어 테스트",
  description: "교안 핵심 어휘로 유의어 5지선다 시험지를 자동 생성하고 PDF로 인쇄하세요.",
  alternates: { canonical: "/voca-test" },
};

function VocaTestFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
      <div className="h-10 w-96 animate-pulse rounded bg-gray-100" />
      <div className="h-80 w-full animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function VocaTestPage() {
  return (
    <Suspense fallback={<VocaTestFallback />}>
      <VocaTestOrchestrator />
    </Suspense>
  );
}
