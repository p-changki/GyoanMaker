"use client";

import { useEffect, useRef, useState } from "react";

interface PasswordModalProps {
  onVerified: (content: string, replyEmail?: string) => void;
  onCancel: () => void;
  postId: string;
}

export default function PasswordModal({
  onVerified,
  onCancel,
  postId,
}: PasswordModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(password)) {
      setError("4자리 숫자를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/board/${postId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "오류가 발생했습니다.");
        return;
      }

      if (data.verified) {
        onVerified(data.content, data.replyEmail);
      } else {
        setError("비밀번호가 틀렸습니다.");
        setPassword("");
      }
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === backdropRef.current) onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-base font-bold text-gray-900">비밀글</h3>
        <p className="mt-2 text-sm text-gray-500">
          비밀번호 4자리를 입력하세요.
        </p>

        <input
          type="password"
          inputMode="numeric"
          value={password}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setPassword(v);
            setError("");
          }}
          maxLength={4}
          placeholder="0000"
          autoFocus
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-[0.3em] focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />

        {error && (
          <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 transition hover:border-gray-300"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || password.length !== 4}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "확인 중..." : "확인"}
          </button>
        </div>
      </form>
    </div>
  );
}
