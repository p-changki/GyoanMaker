"use client";

import { useQuery } from "@tanstack/react-query";
import { usePocketVocaStore } from "../_hooks/usePocketVocaStore";

interface HandoutMeta {
  id: string;
  title: string;
  passageCount: number;
  createdAt: string;
}

async function fetchHandouts(): Promise<HandoutMeta[]> {
  const res = await fetch("/api/handouts");
  if (!res.ok) throw new Error("교안 목록을 불러오지 못했습니다.");
  const data = (await res.json()) as { handouts?: HandoutMeta[] };
  return data.handouts ?? [];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HandoutSelector() {
  const selectedHandoutId = usePocketVocaStore((s) => s.selectedHandoutId);
  const selectHandout = usePocketVocaStore((s) => s.selectHandout);
  const setStep = usePocketVocaStore((s) => s.setStep);

  const { data: handouts = [], isLoading, isError } = useQuery({
    queryKey: ["handouts"],
    queryFn: fetchHandouts,
  });

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 1</p>
        <h2 className="text-2xl font-bold text-gray-900">교안 선택</h2>
        <p className="text-sm text-gray-500">
          포켓보카를 생성할 교안을 하나 선택하세요.
        </p>
      </header>

      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          교안 목록을 불러오는 중입니다.
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          교안 목록을 불러오지 못했습니다.
        </div>
      )}

      {!isLoading && !isError && handouts.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          저장된 교안이 없습니다. 먼저 교안을 생성해 주세요.
        </div>
      )}

      {!isLoading && !isError && handouts.length > 0 && (
        <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
          <ul className="space-y-2 pr-1">
            {handouts.map((handout) => {
              const checked = selectedHandoutId === handout.id;
              return (
                <li key={handout.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                      checked
                        ? "border-[#5E35B1] bg-[#F3E8FF]"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="handout"
                      className="h-4 w-4 shrink-0 accent-[#5E35B1]"
                      checked={checked}
                      onChange={() => selectHandout(handout.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {handout.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {handout.passageCount} 지문 · {formatDate(handout.createdAt)}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!selectedHandoutId}
          className="rounded-lg bg-[#5E35B1] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          다음
        </button>
      </div>
    </section>
  );
}
