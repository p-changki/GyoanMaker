"use client";

import { useState } from "react";

export function PencilHintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`w-3 h-3 shrink-0 transition-colors ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

export default function EditableHintBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-6 flex items-center gap-3 bg-[#5E35B1]/5 border border-[#5E35B1]/15 rounded-xl px-4 py-3">
      <PencilHintIcon className="text-[#5E35B1]/60 w-4! h-4!" />
      <p className="text-xs text-[#5E35B1]/80 font-medium flex-1">
        <strong className="font-bold">Click on handout titles to edit.</strong> Click
        the header text, analysis title, or summary title to enter edit mode.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-[#5E35B1]/40 hover:text-[#5E35B1]/70 transition-colors p-1"
        aria-label="Dismiss hint"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
