"use client";

import { useState, useEffect, useRef } from "react";

interface CopyButtonProps {
  getText: () => string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
  onError?: (error: unknown) => void;
}

export default function CopyButton({
  getText,
  label = "Copy",
  copiedLabel = "Copied ✓",
  className = "",
  disabled = false,
  onError,
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    if (disabled) return;

    try {
      const text = getText();
      await navigator.clipboard.writeText(text);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setIsCopied(true);

      timerRef.current = setTimeout(() => {
        setIsCopied(false);
        timerRef.current = null;
      }, 1500);
    } catch (error) {
      console.error("Failed to copy text:", error);
      if (onError) {
        onError(error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium transition-colors rounded-md border ${
        isCopied
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isCopied ? copiedLabel : label}
    </button>
  );
}
