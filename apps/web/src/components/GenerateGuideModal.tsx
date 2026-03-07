"use client";

import { useEffect, useRef } from "react";

interface GenerateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateGuideModal({
  isOpen,
  onClose,
}: GenerateGuideModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      onClose();
    }
  };

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
          <h2 className="text-lg font-bold text-gray-900">Generation Options Guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Difficulty Section */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Difficulty</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Difficulty — Vocabulary level and content depth
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <p className="text-sm font-bold text-emerald-700">Advanced</p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>For top-level exam prep students</li>
                  <li>B2~C1 advanced vocabulary</li>
                  <li>3 synonyms, 2 antonyms provided</li>
                  <li>In-depth paraphrased topic/summary</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <p className="text-sm font-bold text-emerald-700">Basic</p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>For mid-level students</li>
                  <li>A2~B1 familiar vocabulary</li>
                  <li>2 synonyms, 1 antonym provided</li>
                  <li>Simplified comprehension-focused</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Generation Mode Section */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Generation mode</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Generation Mode — Speed vs. accuracy
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-sm font-bold text-blue-700">Precision Mode</p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>High-accuracy AI engine</li>
                  <li>~30-60 seconds per passage</li>
                  <li>Consistent quality output</li>
                  <li>Recommended for important handouts</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-sm font-bold text-blue-700">Speed Mode</p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>Fast-response AI engine</li>
                  <li>~5-10 seconds per passage</li>
                  <li>Great for bulk generation</li>
                  <li>Recommended for drafts or urgent needs</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Recommended Combinations */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Recommended Combinations</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <span className="text-base mt-0.5">🎯</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Advanced + Precision
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Best quality for exam-prep handouts.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <span className="text-base mt-0.5">⚡</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Basic + Speed
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Quick basic handouts before class.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <span className="text-base mt-0.5">📝</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Basic + Precision
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Accurate foundational handouts for beginners.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </dialog>
  );
}
