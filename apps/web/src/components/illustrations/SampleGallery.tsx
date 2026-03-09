"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { IllustrationSample } from "@gyoanmaker/shared/types";
import SampleCard from "./SampleCard";

async function fetchSamples(): Promise<IllustrationSample[]> {
  const res = await fetch("/api/illustrations/samples");
  if (!res.ok) throw new Error("Failed to load samples");
  const data = (await res.json()) as { samples: IllustrationSample[] };
  return data.samples;
}

export default function SampleGallery() {
  const queryClient = useQueryClient();

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["illustration-samples"],
    queryFn: fetchSamples,
    staleTime: 5 * 60 * 1000,
  });

  const activateMutation = useMutation({
    mutationFn: async (sampleId: string) => {
      const res = await fetch(
        `/api/illustrations/samples/${sampleId}/activate`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to activate");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["illustration-samples"] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (sampleId: string) => {
      const res = await fetch(
        `/api/illustrations/samples/${sampleId}/activate`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to deactivate");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["illustration-samples"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (sampleId: string) => {
      const res = await fetch(
        `/api/illustrations/samples/${sampleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["illustration-samples"] }),
  });

  const isMutating =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending;

  if (isLoading) {
    return (
      <section className="space-y-5">
        <h2 className="text-sm font-bold text-gray-900">샘플 갤러리</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
              <div className="aspect-4/3 animate-pulse bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-7 animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (samples.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
        <p className="text-sm text-gray-400">
          저장된 삽화 샘플이 없습니다. 프롬프트를 입력하고 생성해보세요.
        </p>
      </section>
    );
  }

  const presets = samples.filter((s) => s.isPreset);
  const userSamples = samples.filter((s) => !s.isPreset);

  return (
    <section className="space-y-5">
      <h2 className="text-sm font-bold text-gray-900">
        샘플 갤러리{" "}
        <span className="font-normal text-gray-400">({userSamples.length}/30)</span>
      </h2>

      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">기본 제공 스타일</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {presets.map((sample) => (
              <SampleCard
                key={sample.sampleId}
                sample={sample}
                onActivate={(id) => activateMutation.mutate(id)}
                onDeactivate={(id) => deactivateMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                isLoading={isMutating}
              />
            ))}
          </div>
        </div>
      )}

      {userSamples.length > 0 && (
        <div className="space-y-2">
          {presets.length > 0 && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">내 스타일</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {userSamples.map((sample) => (
              <SampleCard
                key={sample.sampleId}
                sample={sample}
                onActivate={(id) => activateMutation.mutate(id)}
                onDeactivate={(id) => deactivateMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                isLoading={isMutating}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
