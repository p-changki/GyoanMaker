"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HandoutIllustrations, IllustrationBubbleStyle, IllustrationConceptMode } from "@gyoanmaker/shared/types";
import { useHandoutStore } from "@/stores/useHandoutStore";

type IllustrationApplyOptions = {
  scope: "all" | "stale" | "passages";
  quality: "draft" | "standard" | "hq";
  overwritePolicy: "skip_completed" | "overwrite_all" | "stale_only";
  passageIds?: string[];
  conceptMode?: IllustrationConceptMode;
  conceptText?: string;
  includeKoreanText?: boolean;
  bubbleCount?: number;
  bubbleStyle?: IllustrationBubbleStyle;
  customBubbleTexts?: string[];
};

type IllustrationJobProgress = {
  id?: string;
  status?: string;
  completed?: number;
  failed?: number;
  total?: number;
};

function toIllustrationProgress(job: IllustrationJobProgress | undefined) {
  return {
    status: job?.status ?? "running",
    completed: Number(job?.completed ?? 0),
    failed: Number(job?.failed ?? 0),
    total: Number(job?.total ?? 0),
  };
}

export function useIllustrationManager(handoutId: string | null) {
  const setIllustrations = useHandoutStore((state) => state.setIllustrations);

  const [isApplyingIllustrations, setIsApplyingIllustrations] = useState(false);
  const [illustrationJobId, setIllustrationJobId] = useState<string | null>(null);
  const [illustrationProgress, setIllustrationProgress] = useState({
    status: "idle",
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [illustrationMessage, setIllustrationMessage] = useState<string | null>(null);
  const [illustrationCreditError, setIllustrationCreditError] = useState<{ needed: number; available: number } | null>(null);
  const didResumeIllustrationByHandoutRef = useRef<string | null>(null);

  const syncHandoutIllustrations = useCallback(async () => {
    if (!handoutId) return;
    const refreshRes = await fetch(`/api/handouts/${handoutId}`);
    if (!refreshRes.ok) return;
    const handout = await refreshRes.json();
    const illustrations =
      handout?.illustrations && typeof handout.illustrations === "object"
        ? (handout.illustrations as HandoutIllustrations)
        : {};
    setIllustrations(illustrations);
  }, [handoutId, setIllustrations]);

  const runIllustrationLoop = useCallback(
    async (jobId: string): Promise<string> => {
      if (!handoutId) {
        throw new Error("handoutId is required to run illustration job.");
      }

      const startedAt = Date.now();
      const timeoutMs = 10 * 60 * 1000;
      let finalStatus = "running";

      while (true) {
        const runRes = await fetch(`/api/illustrations/jobs/${jobId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchSize: 3 }),
        });
        const runData = await runRes.json().catch(() => ({}));
        if (!runRes.ok) {
          throw new Error(runData?.error?.message || "일러스트 생성 실행 중 오류가 발생했습니다.");
        }

        const job = runData?.job as IllustrationJobProgress;
        setIllustrationProgress(toIllustrationProgress(job));
        await syncHandoutIllustrations();

        finalStatus = job?.status ?? "running";
        if (
          finalStatus === "completed" ||
          finalStatus === "partial_failed" ||
          finalStatus === "failed" ||
          finalStatus === "canceled"
        ) {
          break;
        }

        if (Date.now() - startedAt > timeoutMs) {
          throw new Error("일러스트 생성 시간이 10분을 초과했습니다. 잠시 후 다시 시도해주세요.");
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      return finalStatus;
    },
    [handoutId, syncHandoutIllustrations]
  );

  const handleApplyIllustrations = useCallback(
    async (options?: Partial<IllustrationApplyOptions>) => {
      if (!handoutId) {
        setIllustrationMessage("저장된 교안(handout)에서만 일러스트를 생성할 수 있습니다.");
        return;
      }

      const payload: IllustrationApplyOptions = {
        scope: options?.scope ?? "all",
        quality: options?.quality ?? "standard",
        overwritePolicy: options?.overwritePolicy ?? "skip_completed",
        conceptMode: options?.conceptMode ?? "off",
        conceptText: options?.conceptText,
        includeKoreanText: options?.includeKoreanText ?? false,
        bubbleCount: options?.bubbleCount,
        bubbleStyle: options?.bubbleStyle,
        customBubbleTexts: options?.customBubbleTexts,
        passageIds: Array.isArray(options?.passageIds)
          ? options?.passageIds.filter(
              (id): id is string => typeof id === "string" && id.trim().length > 0
            )
          : undefined,
      };

      if (payload.scope === "passages" && (!payload.passageIds || payload.passageIds.length === 0)) {
        setIllustrationMessage("passages 범위 선택 시 최소 1개 이상의 passage를 선택해야 합니다.");
        return;
      }

      setIsApplyingIllustrations(true);
      setIllustrationMessage(null);
      setIllustrationProgress({ status: "queued", completed: 0, failed: 0, total: 0 });

      try {
        const createRes = await fetch("/api/illustrations/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handoutId,
            scope: payload.scope,
            passageIds: payload.scope === "passages" ? payload.passageIds : undefined,
            quality: payload.quality,
            overwritePolicy: payload.overwritePolicy,
            conceptMode: payload.conceptMode,
            conceptText: payload.conceptText,
            includeKoreanText: payload.includeKoreanText,
            bubbleCount: payload.bubbleCount,
            bubbleStyle: payload.bubbleStyle,
            customBubbleTexts: payload.customBubbleTexts,
          }),
        });
        const createData = await createRes.json().catch(() => ({}));

        if (createRes.status === 409) {
          const conflictedJobId = createData?.error?.jobId;
          if (typeof conflictedJobId === "string" && conflictedJobId.length > 0) {
            setIllustrationJobId(conflictedJobId);
            setIllustrationMessage("이미 진행 중인 일러스트 작업을 이어서 진행합니다.");
            const finalStatus = await runIllustrationLoop(conflictedJobId);
            if (finalStatus === "completed") {
              setIllustrationMessage("일러스트 생성이 완료되었습니다.");
            } else if (finalStatus === "partial_failed") {
              setIllustrationMessage(
                "일부 일러스트 생성에 실패했습니다. 재시도를 진행해주세요."
              );
            } else {
              setIllustrationMessage("일러스트 생성이 중단되었거나 실패했습니다.");
            }
            return;
          }
        }

        if (createRes.status === 402) {
          const needed = typeof createData?.error?.needed === "number" ? createData.error.needed : 0;
          const available = typeof createData?.error?.available === "number" ? createData.error.available : 0;
          setIllustrationCreditError({ needed, available });
          setIsApplyingIllustrations(false);
          return;
        }

        if (!createRes.ok) {
          const detail =
            createData?.error?.message ??
            "일러스트 작업을 생성하지 못했습니다. 크레딧을 확인해주세요.";
          throw new Error(detail);
        }

        const job = createData?.job as IllustrationJobProgress | undefined;
        const jobId =
          typeof createData.jobId === "string" ? createData.jobId : createData?.job?.id;
        if (!jobId) {
          throw new Error("일러스트 작업 ID를 받지 못했습니다.");
        }
        if (job) {
          setIllustrationProgress(toIllustrationProgress(job));
        }
        setIllustrationJobId(jobId);
        const finalStatus = await runIllustrationLoop(jobId);

        if (finalStatus === "completed") {
          setIllustrationMessage("일러스트 생성이 완료되었습니다.");
        } else if (finalStatus === "partial_failed") {
          setIllustrationMessage("일부 일러스트 생성에 실패했습니다. 재시도를 진행해주세요.");
        } else {
          setIllustrationMessage("일러스트 생성이 중단되었거나 실패했습니다.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setIllustrationMessage(message);
      } finally {
        setIsApplyingIllustrations(false);
      }
    },
    [handoutId, runIllustrationLoop]
  );

  const handleCancelIllustrations = useCallback(async () => {
    if (!illustrationJobId) return;
    setIsApplyingIllustrations(true);
    setIllustrationMessage(null);
    try {
      const cancelRes = await fetch(`/api/illustrations/jobs/${illustrationJobId}/cancel`, {
        method: "POST",
      });
      const cancelData = await cancelRes.json().catch(() => ({}));
      if (!cancelRes.ok) {
        throw new Error(cancelData?.error?.message || "일러스트 작업 취소에 실패했습니다.");
      }

      const job = cancelData?.job as IllustrationJobProgress | undefined;
      if (job) {
        setIllustrationProgress(toIllustrationProgress(job));
      } else {
        setIllustrationProgress((prev) => ({ ...prev, status: "canceled" }));
      }
      await syncHandoutIllustrations();
      setIllustrationMessage("일러스트 작업이 취소되었습니다. 미사용 크레딧은 환불 처리됩니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setIllustrationMessage(message);
    } finally {
      setIsApplyingIllustrations(false);
    }
  }, [illustrationJobId, syncHandoutIllustrations]);

  const handleRetryIllustrations = useCallback(async () => {
    if (!illustrationJobId) return;
    setIsApplyingIllustrations(true);
    setIllustrationMessage(null);
    try {
      const retryRes = await fetch(`/api/illustrations/jobs/${illustrationJobId}/retry`, {
        method: "POST",
      });
      const retryData = await retryRes.json().catch(() => ({}));
      if (!retryRes.ok) {
        throw new Error(retryData?.error?.message || "실패 항목 재시도에 실패했습니다.");
      }

      const finalStatus = await runIllustrationLoop(illustrationJobId);
      if (finalStatus === "completed") {
        setIllustrationMessage("재시도 후 일러스트 생성이 완료되었습니다.");
      } else if (finalStatus === "partial_failed") {
        setIllustrationMessage("재시도 후에도 일부 항목이 실패했습니다.");
      } else {
        setIllustrationMessage("재시도 작업이 중단되었거나 실패했습니다.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setIllustrationMessage(message);
    } finally {
      setIsApplyingIllustrations(false);
    }
  }, [illustrationJobId, runIllustrationLoop]);

  // Resume active illustration job on mount
  useEffect(() => {
    if (!handoutId) return;
    if (didResumeIllustrationByHandoutRef.current === handoutId) return;
    didResumeIllustrationByHandoutRef.current = handoutId;

    let cancelled = false;
    (async () => {
      try {
        const listRes = await fetch(
          `/api/illustrations/jobs?handoutId=${encodeURIComponent(handoutId)}&activeOnly=true&limit=1`
        );
        if (!listRes.ok) return;
        const listData = (await listRes.json().catch(() => ({}))) as {
          jobs?: IllustrationJobProgress[];
        };
        const activeJob = Array.isArray(listData.jobs) ? listData.jobs[0] : null;
        if (!activeJob?.id || cancelled) return;

        setIllustrationJobId(activeJob.id);
        setIllustrationProgress(toIllustrationProgress(activeJob));
        setIllustrationMessage("진행 중인 일러스트 작업을 이어서 진행합니다.");
        setIsApplyingIllustrations(true);
        const finalStatus = await runIllustrationLoop(activeJob.id);
        if (cancelled) return;

        if (finalStatus === "completed") {
          setIllustrationMessage("일러스트 생성이 완료되었습니다.");
        } else if (finalStatus === "partial_failed") {
          setIllustrationMessage("일부 일러스트 생성에 실패했습니다. 재시도를 진행해주세요.");
        } else {
          setIllustrationMessage("일러스트 생성이 중단되었거나 실패했습니다.");
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unknown error";
        setIllustrationMessage(message);
      } finally {
        if (!cancelled) {
          setIsApplyingIllustrations(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handoutId, runIllustrationLoop]);

  // Fetch active illustration sample for concept mode UI
  const activeSampleQuery = useQuery({
    queryKey: ["illustration-samples-active"],
    queryFn: async () => {
      const res = await fetch("/api/illustrations/samples");
      if (!res.ok) return null;
      const data = (await res.json()) as { samples?: Array<{ isActive: boolean; imageUrl: string; prompt: string }> };
      return data.samples?.find((s) => s.isActive) ?? null;
    },
    staleTime: 60_000,
  });

  return {
    isApplyingIllustrations,
    illustrationJobId,
    illustrationProgress,
    illustrationMessage,
    illustrationCreditError,
    setIllustrationCreditError,
    handleApplyIllustrations,
    handleRetryIllustrations,
    handleCancelIllustrations,
    activeSample: activeSampleQuery.data ?? null,
  };
}
