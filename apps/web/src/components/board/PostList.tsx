"use client";

import Link from "next/link";
import type { PostMeta } from "@/lib/board/types";

function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + "**";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TypeBadge({ type }: { type: PostMeta["type"] }) {
  if (type === "notice") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <title>공지</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        공지
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <title>비밀글</title>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      비밀
    </span>
  );
}

interface PostListProps {
  posts: PostMeta[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentUserEmail: string;
}

export default function PostList({
  posts,
  currentPage,
  totalPages,
  onPageChange,
  currentUserEmail,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium text-gray-400">
          아직 게시글이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/board/${post.id}`}
            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
          >
            <TypeBadge type={post.type} />
            <span
              className={`flex-1 truncate text-sm font-medium ${
                post.type === "notice"
                  ? "font-bold text-gray-900"
                  : "text-gray-700"
              }`}
            >
              {post.title}
              {post.type === "secret" && post.authorEmail === currentUserEmail.toLowerCase() && (
                <span className="ml-1.5 inline-flex rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-500">
                  내 글
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs text-gray-400">
              {post.type === "secret"
                ? maskName(post.authorName ?? post.authorEmail.split("@")[0])
                : (post.authorName ?? post.authorEmail.split("@")[0])}
            </span>
            <span className="shrink-0 text-xs text-gray-300">
              {formatDate(post.createdAt)}
            </span>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                page === currentPage
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}
