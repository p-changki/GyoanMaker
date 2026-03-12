"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PocketVocaData, PocketVocaConfig } from "@gyoanmaker/shared/types";
import { usePocketVocaStore } from "../_hooks/usePocketVocaStore";

interface PocketVocaMeta {
  id: string;
  title: string;
  passageCount: number;
  model: "flash" | "pro";
  handoutTitle: string;
  createdAt: string;
}

interface SavedPocketVoca extends PocketVocaMeta {
  data: PocketVocaData;
  config: PocketVocaConfig;
}

async function fetchSavedList(): Promise<PocketVocaMeta[]> {
  const res = await fetch("/api/pocket-vocas");
  if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
  const json = (await res.json()) as { items?: PocketVocaMeta[] };
  return json.items ?? [];
}

async function fetchSavedDetail(id: string): Promise<SavedPocketVoca> {
  const res = await fetch(`/api/pocket-vocas/${id}`);
  if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
  const json = (await res.json()) as { item: SavedPocketVoca };
  return json.item;
}

async function deleteSaved(id: string): Promise<void> {
  const res = await fetch(`/api/pocket-vocas/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SavedPocketVocaList() {
  const setGeneratedData = usePocketVocaStore((s) => s.setGeneratedData);
  const updateConfig = usePocketVocaStore((s) => s.updateConfig);
  const setStep = usePocketVocaStore((s) => s.setStep);
  const queryClient = useQueryClient();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["pocket-vocas"],
    queryFn: fetchSavedList,
    enabled: isOpen,
    staleTime: 2 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSaved,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pocket-vocas"] });
    },
  });

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      const saved = await fetchSavedDetail(id);
      setGeneratedData(saved.data);
      updateConfig(saved.config);
      setStep(3);
    } catch {
      // silently ignore — user can retry
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <span>저장된 포켓보카</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {isLoading && (
            <p className="text-xs text-gray-500">불러오는 중...</p>
          )}
          {isError && (
            <p className="text-xs text-red-500">목록을 불러오지 못했습니다.</p>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="text-xs text-gray-400">저장된 포켓보카가 없습니다.</p>
          )}
          {items.length > 0 && (
            <div className="overflow-y-auto" style={{ maxHeight: "280px" }}>
              <ul className="space-y-2 pr-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.passageCount} 지문 ·{" "}
                          <span className="font-bold uppercase text-[#5E35B1]">{item.model}</span>
                          {" "}· {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleLoad(item.id)}
                        disabled={loadingId === item.id}
                        className="shrink-0 rounded-md bg-[#5E35B1] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#4527A0] disabled:opacity-60"
                      >
                        {loadingId === item.id ? "로딩..." : "불러오기"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        className="shrink-0 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-400 transition hover:border-red-200 hover:text-red-500"
                        aria-label="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
