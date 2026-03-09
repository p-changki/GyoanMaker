"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordModal from "./PasswordModal";
import DeletePostModal from "./DeletePostModal";
import type { PostDetail as PostDetailType } from "@/lib/board/types";

interface LockedPost {
  id: string;
  type: "secret";
  title: string;
  authorEmail: string;
  authorName: string | null;
  pinned: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  content: null;
  locked: true;
  canDelete?: boolean;
}

type PostResponse = PostDetailType | LockedPost;

function isLocked(post: PostResponse): post is LockedPost {
  return "locked" in post && post.locked === true;
}

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
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function deletePostApi(id: string): Promise<void> {
  const res = await fetch(`/api/board/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete post.");
}

interface PostDetailViewProps {
  post: PostResponse;
  currentUserEmail: string;
  isAdmin: boolean;
}

export default function PostDetailView({
  post,
  currentUserEmail,
  isAdmin,
}: PostDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);
  const [unlockedReplyEmail, setUnlockedReplyEmail] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deletePostApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-posts"] });
      router.push("/board");
    },
  });

  const locked = isLocked(post);
  const isAuthor = post.authorEmail === currentUserEmail.toLowerCase();
  const canDelete = locked ? post.canDelete === true : isAuthor || isAdmin;
  const content = locked ? unlockedContent : post.content;
  const needsPassword = locked && unlockedContent === null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          {post.type === "notice" ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
              공지
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-500">
              비밀글
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span>
            {post.type === "secret"
              ? maskName(post.authorName ?? post.authorEmail.split("@")[0])
              : (post.authorName ?? post.authorEmail.split("@")[0])}
          </span>
          <span className="text-gray-200">|</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        {/* Reply email visible after unlock or for notice posts */}
        {(() => {
          const email = locked ? unlockedReplyEmail : ("replyEmail" in post ? post.replyEmail : null);
          if (!email) return null;
          return (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <title>이메일</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="font-medium text-gray-500">{email}</span>
            </div>
          );
        })()}
      </div>

      <hr className="mb-6 border-gray-100" />

      {/* Content */}
      {needsPassword ? (
        <div className="py-16 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <title>잠금</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="mb-4 text-sm text-gray-400">
            이 글은 비밀번호로 보호되어 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            비밀번호 입력
          </button>
        </div>
      ) : (
        <div
          className="tiptap-content prose prose-sm max-w-none min-h-[200px] text-gray-700"
          dangerouslySetInnerHTML={{ __html: content ?? "" }}
        />
      )}

      <hr className="mt-6 border-gray-100" />

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <Link
          href="/board"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 transition hover:border-gray-300"
        >
          목록으로
        </Link>
        {canDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-red-400 transition hover:border-red-300 hover:text-red-500"
          >
            삭제
          </button>
        )}
      </div>

      {/* Modals */}
      {showPasswordModal && (
        <PasswordModal
          postId={post.id}
          onVerified={(c, email) => {
            setUnlockedContent(c);
            setUnlockedReplyEmail(email ?? null);
            setShowPasswordModal(false);
          }}
          onCancel={() => setShowPasswordModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeletePostModal
          title={post.title}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(post.id)}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
