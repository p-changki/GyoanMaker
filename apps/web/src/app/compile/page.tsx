"use client";

import { Suspense } from "react";
import CompileOrchestrator from "./_components/CompileOrchestrator";

function CompileFallback() {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col items-center justify-start pt-12 px-8 bg-gray-50/50">
          <div className="w-full max-w-[595px] bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-5">
            <div className="animate-pulse rounded bg-gray-100 h-5 w-48" />
            <div className="animate-pulse rounded bg-gray-100 h-3 w-full" />
            <div className="animate-pulse rounded bg-gray-100 h-3 w-5/6" />
            <div className="animate-pulse rounded bg-gray-100 h-3 w-4/6" />
          </div>
        </div>
        <div className="w-[320px] shrink-0 border-l border-gray-200 p-5 space-y-6">
          <div className="animate-pulse rounded-lg bg-gray-100 h-8 w-full" />
          <div className="space-y-3">
            <div className="animate-pulse rounded bg-gray-100 h-3 w-24" />
            <div className="animate-pulse rounded-lg bg-gray-100 h-10 w-full" />
            <div className="animate-pulse rounded-lg bg-gray-100 h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompilePage() {
  return (
    <Suspense fallback={<CompileFallback />}>
      <CompileOrchestrator />
    </Suspense>
  );
}
