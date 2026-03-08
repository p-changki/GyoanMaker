"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "linear-gradient(135deg, #fef9f0, #f8f9fc, #fff7ed)",
          padding: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            background: "white",
            borderRadius: "1.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.6)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              background: "#fef2f2",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="32"
              height="32"
              fill="none"
              stroke="#ef4444"
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

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              lineHeight: 1.6,
              margin: "0 0 1.5rem",
            }}
          >
            A critical error occurred.
            <br />
            Please try again.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                fontFamily: "monospace",
                marginBottom: "1rem",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders outside Next.js layout */}
            <a
              href="/"
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "white",
                color: "#4b5563",
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
