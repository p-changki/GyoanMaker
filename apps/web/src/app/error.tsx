"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef9f0] via-[#f8f9fc] to-[#fff7ed] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-premium border border-gray-200/60 p-8 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Error icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              An unexpected error occurred.
              <br />
              Please try again or return to the home page.
            </p>
          </div>

          {error.digest && (
            <p className="text-xs text-gray-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold text-center hover:bg-gray-50 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
