"use client";

import { Suspense } from "react";
import VocaTestOrchestrator from "./_components/VocaTestOrchestrator";

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
