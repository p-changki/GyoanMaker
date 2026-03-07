"use client";

import { ReactNode } from "react";
import ProgressBar from "./ProgressBar";

interface ActionBarProps {
  completed: number;
  total: number;
  onBack: () => void;
  children?: ReactNode;
}

export default function ActionBar({
  completed,
  total,
  onBack,
  children,
}: ActionBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 py-3 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Go back</title>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1 sm:w-48">
            <ProgressBar completed={completed} total={total} />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto justify-end">
          {children}
        </div>
      </div>
    </div>
  );
}
