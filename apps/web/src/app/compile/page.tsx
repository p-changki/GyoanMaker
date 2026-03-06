"use client";

import { Suspense } from "react";
import CompileOrchestrator from "./_components/CompileOrchestrator";

function CompileFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#5E35B1] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-[#5E35B1] animate-pulse uppercase tracking-widest">
          Loading Layout...
        </p>
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
