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
    staleTime: 30_000,
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
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold text-gray-900">샘플 갤러리</h2>
        <p className="mt-3 text-sm text-gray-400">불러오는 중...</p>
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

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-gray-900">
        샘플 갤러리{" "}
        <span className="font-normal text-gray-400">({samples.length}/30)</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {samples.map((sample) => (
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
    </section>
  );
}
