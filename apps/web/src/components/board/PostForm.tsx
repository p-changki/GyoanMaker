"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { PostType } from "@/lib/board/types";
import TiptapEditor from "./TiptapEditor";

interface CreatePostBody {
  type: PostType;
  title: string;
  content: string;
  password?: string;
  replyEmail?: string;
}

async function createPostApi(body: CreatePostBody): Promise<void> {
  const res = await fetch("/api/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Failed to create post.");
  }
}

interface PostFormProps {
  isAdmin: boolean;
  userEmail: string;
}

export default function PostForm({ isAdmin, userEmail }: PostFormProps) {
  const router = useRouter();
  const [type, setType] = useState<PostType>(isAdmin ? "notice" : "secret");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [replyEmail, setReplyEmail] = useState(userEmail);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: createPostApi,
    onSuccess: () => {
      router.push("/board");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;
    if (type === "secret" && !/^\d{4}$/.test(password)) return;

    mutation.mutate({
      type,
      title: title.trim(),
      content: content.trim(),
      replyEmail: type === "secret" ? replyEmail.trim() : undefined,
      password: type === "secret" ? password : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      {isAdmin ? (
        <div>
          <label className="mb-1.5 block text-xs font-bold text-gray-500">
            글 유형
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("notice")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                type === "notice"
                  ? "bg-amber-100 text-amber-800"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              공지
            </button>
            <button
              type="button"
              onClick={() => setType("secret")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                type === "secret"
                  ? "bg-gray-800 text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              비밀글
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          비밀글로 작성됩니다. 작성자와 관리자만 내용을 볼 수 있습니다.
        </p>
      )}

      {/* Title */}
      <div>
        <label htmlFor="post-title" className="mb-1.5 block text-xs font-bold text-gray-500">
          제목
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="제목을 입력하세요"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <p className="mt-1 text-right text-[11px] text-gray-300">
          {title.length}/100
        </p>
      </div>

      {/* Reply email (secret only) */}
      {type === "secret" && (
        <div>
          <label htmlFor="post-reply-email" className="mb-1.5 block text-xs font-bold text-gray-500">
            회신 이메일
          </label>
          <input
            id="post-reply-email"
            type="email"
            value={replyEmail}
            onChange={(e) => setReplyEmail(e.target.value)}
            placeholder="sample@gmail.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <p className="mt-1 text-[11px] text-gray-300">
            관리자가 이 이메일로 샘플을 보내드립니다.
          </p>
        </div>
      )}

      {/* Content */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-gray-500">
          내용
        </label>
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="내용을 입력하세요"
          maxLength={5000}
        />
      </div>

      {/* Password (secret only) */}
      {type === "secret" && (
        <div>
          <label htmlFor="post-password" className="mb-1.5 block text-xs font-bold text-gray-500">
            비밀번호 (숫자 4자리)
          </label>
          <input
            id="post-password"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={password}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPassword(v);
            }}
            maxLength={4}
            placeholder="숫자 4자리 입력"
            className="w-40 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm tracking-widest focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
      )}

      {/* Error */}
      {mutation.isError && (
        <p className="text-sm font-medium text-red-500">
          {mutation.error.message}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={
            mutation.isPending ||
            !title.trim() ||
            !content.trim() ||
            (type === "secret" && !/^\d{4}$/.test(password))
          }
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending ? "작성 중..." : "작성하기"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/board")}
          className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:border-gray-300"
        >
          취소
        </button>
      </div>
    </form>
  );
}
