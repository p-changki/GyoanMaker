"use client";

import { useState } from "react";
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

async function fetchHandouts(): Promise<HandoutMeta[]> {
  const res = await fetch("/api/handouts");
  if (!res.ok) throw new Error("교안 목록을 불러오지 못했습니다.");
  const data = await res.json();
  return data.handouts ?? [];
}

async function deleteHandoutApi(id: string): Promise<void> {
  const res = await fetch(`/api/handouts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("교안 삭제에 실패했습니다.");
}

async function renameHandoutApi(id: string, title: string): Promise<void> {
  const res = await fetch(`/api/handouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("교안 이름 변경에 실패했습니다.");
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

function levelLabel(level: string): string {
  return level === "basic" ? "기본" : "심화";
}

function modelLabel(model: string): string {
  return model === "flash" ? "Flash" : "Pro";
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: handouts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["handouts"],
    queryFn: fetchHandouts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHandoutApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handouts"] });
      setDeletingId(null);
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">내 교안</h2>
          <p className="text-sm text-gray-500 mt-1">
            저장된 교안을 관리하고 다시 불러올 수 있습니다.
          </p>
        </div>
        <Link
          href="/generate"
          className="px-4 py-2 bg-[#5E35B1] text-white rounded-lg text-sm font-bold hover:bg-[#4527A0] transition-colors"
        >
          새 교안 생성
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#5E35B1] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-sm text-red-600 font-medium">
          교안 목록을 불러오는 데 실패했습니다. 새로고침 해주세요.
        </div>
      )}

      {!isLoading && !isError && handouts && handouts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm font-medium mb-4">
            아직 저장된 교안이 없습니다.
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
        <div className="space-y-3">
          {handouts.map((h) => (
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
                    <span>{h.passageCount}개 지문</span>
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
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      열기
                    </Link>
                    <button
                      type="button"
                      onClick={() => startRename(h)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-gray-300 transition-colors"
                    >
                      이름변경
                    </button>
                    {deletingId === h.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(h.id)}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          확인
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => confirmDelete(h.id)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-red-400 hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
