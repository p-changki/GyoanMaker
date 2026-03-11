import { Suspense } from "react";
import PocketVocaOrchestrator from "./_components/PocketVocaOrchestrator";

export const metadata = {
  title: "포켓보카 | GyoanMaker",
  description: "교안 지문 기반 핵심 어휘 + 유의어/반의어 생성",
};

function PocketVocaFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
      <div className="h-10 w-96 animate-pulse rounded bg-gray-100" />
      <div className="h-80 w-full animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function PocketVocaPage() {
  return (
    <Suspense fallback={<PocketVocaFallback />}>
      <PocketVocaOrchestrator />
    </Suspense>
  );
}
