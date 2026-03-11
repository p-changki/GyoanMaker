"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

interface HandoutMeta {
  id: string;
  title: string;
  passageCount: number;
  level: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface StorageQuota {
  used: number;
  limit: number | null;
}

async function fetchHandouts(): Promise<HandoutMeta[]> {
  const res = await fetch("/api/handouts");
  if (!res.ok) throw new Error("Failed to load handouts.");
  const data = await res.json();
  return data.handouts ?? [];
}

async function fetchStorageQuota(): Promise<StorageQuota> {
  const res = await fetch("/api/quota");
  if (!res.ok) throw new Error("Failed to load quota.");
  const data = await res.json();
  return { used: data.storage?.used ?? 0, limit: data.storage?.limit ?? null };
}

async function deleteHandoutApi(id: string): Promise<void> {
  const res = await fetch(`/api/handouts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete handout.");
}

async function renameHandoutApi(id: string, title: string): Promise<void> {
  const res = await fetch(`/api/handouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename handout.");
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

function DeleteModal({
  title,
  isPending,
  onConfirm,
  onCancel,
}: {
  title: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === backdropRef.current) onCancel();
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">교안 삭제</h3>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{title}</span>을(를)
          삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 transition hover:border-gray-300"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

function levelLabel(level: string): string {
  return level === "basic" ? "Basic" : "Advanced";
}

function modelLabel(model: string): string {
  return model === "flash" ? "Speed" : "Precision";
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const {
    data: handouts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["handouts"],
    queryFn: fetchHandouts,
  });

  const { data: storageQuota } = useQuery({
    queryKey: ["storage-quota"],
    queryFn: fetchStorageQuota,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHandoutApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handouts"] });
      setDeletingId(null);
      // Adjust page if last item on current page was deleted
      setCurrentPage((p) => {
        const remaining = (handouts?.length ?? 1) - 1;
        const maxPage = Math.max(1, Math.ceil(remaining / PAGE_SIZE));
        return Math.min(p, maxPage);
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameHandoutApi(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handouts"] });
      setEditingId(null);
      setEditTitle("");
    },
  });

  function startRename(handout: HandoutMeta) {
    setEditingId(handout.id);
    setEditTitle(handout.title);
  }

  function submitRename() {
    if (!editingId || !editTitle.trim()) return;
    renameMutation.mutate({ id: editingId, title: editTitle.trim() });
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
  }

  const handlePrefetch = useCallback(
    (handoutId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["compile-init", handoutId],
        queryFn: async () => {
          const res = await fetch(`/api/compile/init/${handoutId}`);
          if (!res.ok) throw new Error("Failed to prefetch.");
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const totalPages = handouts ? Math.ceil(handouts.length / PAGE_SIZE) : 0;
  const paginatedHandouts = handouts
    ? handouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">내 교안</h2>
          <p className="text-sm text-gray-500 mt-1">
            저장된 교안을 관리하고 다시 열 수 있습니다.
            {storageQuota && storageQuota.limit !== null && (
              <span className={`ml-2 font-medium ${storageQuota.used >= storageQuota.limit ? "text-red-500" : "text-gray-400"}`}>
                ({storageQuota.used}/{storageQuota.limit}개)
              </span>
            )}
          </p>
        </div>
        <Link
          href="/generate"
          className="px-4 py-2 bg-[#5E35B1] text-white rounded-lg text-sm font-bold hover:bg-[#4527A0] transition-colors"
        >
          새 교안
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#5E35B1] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-sm text-red-600 font-medium">
          교안을 불러오지 못했습니다. 페이지를 새로고침해 주세요.
        </div>
      )}

      {!isLoading && !isError && handouts && handouts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm font-medium mb-4">
            저장된 교안이 없습니다.
          </p>
          <Link
            href="/generate"
            className="text-[#5E35B1] text-sm font-bold hover:underline"
          >
            첫 교안 만들기
          </Link>
        </div>
      )}

      {!isLoading && handouts && handouts.length > 0 && (
        <>
        <div className="space-y-3">
          {paginatedHandouts.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {editingId === h.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditTitle("");
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={submitRename}
                        disabled={renameMutation.isPending}
                        className="px-3 py-1.5 bg-[#5E35B1] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditTitle("");
                        }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {h.title}
                    </h3>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{h.passageCount} 지문</span>
                    <span className="text-gray-200">|</span>
                    <span>{levelLabel(h.level)}</span>
                    <span className="text-gray-200">|</span>
                    <span>{modelLabel(h.model)}</span>
                    <span className="text-gray-200">|</span>
                    <span>{formatDate(h.createdAt)}</span>
                  </div>
                </div>

                {editingId !== h.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/compile?handoutId=${h.id}`}
                      onMouseEnter={() => handlePrefetch(h.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      열기
                    </Link>
                    <Link
                      href={`/voca-test?handoutId=${h.id}`}
                      className="px-3 py-1.5 bg-[#F3E8FF] text-[#5E35B1] rounded-lg text-xs font-bold hover:bg-[#EDE7F6] transition-colors"
                    >
                      보카
                    </Link>
                    <button
                      type="button"
                      onClick={() => startRename(h)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-gray-300 transition-colors"
                    >
                      이름 변경
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(h.id)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-red-400 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  page === currentPage
                    ? "bg-[#5E35B1] text-white"
                    : "border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
        </>
      )}

      {deletingId && handouts && (() => {
        const target = handouts.find((h) => h.id === deletingId);
        if (!target) return null;
        return (
          <DeleteModal
            title={target.title}
            isPending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate(deletingId)}
            onCancel={() => setDeletingId(null)}
          />
        );
      })()}
    </div>
  );
}
