"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { generatePassages } from "@/services/api";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
import type { HandoutIllustrations, IllustrationConceptMode } from "@gyoanmaker/shared/types";
import { getCachedResult, hashPassages, setCachedResult } from "@/services/cache";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import type { TemplateSettings } from "@gyoanmaker/shared/types";
import { DEFAULT_TEMPLATE_SETTINGS } from "@gyoanmaker/shared/types";
import {
  COMPILED_PREFIX,
  INPUT_MAX_AGE_MS,
  INPUT_STORAGE_KEY,
  type CompileInputData,
  createInitialSections,
} from "./compileData.constants";
import { useCompileActions } from "./useCompileActions";

type IllustrationApplyOptions = {
  scope: "all" | "stale" | "passages";
  quality: "draft" | "standard" | "hq";
  overwritePolicy: "skip_completed" | "overwrite_all" | "stale_only";
  passageIds?: string[];
  conceptMode?: IllustrationConceptMode;
  conceptText?: string;
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

export function useCompileData() {
  const searchParams = useSearchParams();
  const handoutId = searchParams.get("handoutId");
  const queryClient = useQueryClient();

  // Invalidate template settings on mount so manual edits don't persist across navigations
  const didInvalidateRef = useRef(false);
  useEffect(() => {
    if (!didInvalidateRef.current) {
      didInvalidateRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["templateSettings"] });
    }
  }, [queryClient]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isApplyingIllustrations, setIsApplyingIllustrations] = useState(false);
  const [illustrationJobId, setIllustrationJobId] = useState<string | null>(null);
  const [illustrationProgress, setIllustrationProgress] = useState({
    status: "idle",
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [illustrationMessage, setIllustrationMessage] = useState<string | null>(null);
  const didResumeIllustrationByHandoutRef = useRef<string | null>(null);

  const setCompiledData = useHandoutStore((state) => state.setCompiledData);
  const setIllustrations = useHandoutStore((state) => state.setIllustrations);
  const setApplying = useHandoutStore((state) => state.setApplying);
  const setProgress = useHandoutStore((state) => state.setProgress);
  const updateSection = useHandoutStore((state) => state.updateSection);

  const handoutQuery = useQuery({
    queryKey: ["handout", handoutId],
    enabled: Boolean(handoutId),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const res = await fetch(`/api/handouts/${handoutId}`);
      if (!res.ok) throw new Error("Failed to load handout.");
      const data = await res.json();

      const sections: Record<string, HandoutSection> = {};
      for (const [id, rawText] of Object.entries(data.sections as Record<string, string>)) {
        sections[id] = {
          passageId: id,
          sentences: [],
          topic: { en: "", ko: "" },
          summary: { en: "", ko: "" },
          flow: [],
          vocabulary: [],
          rawText,
          isParsed: false,
        };
      }
      const illustrations =
        data.illustrations && typeof data.illustrations === "object"
          ? (data.illustrations as HandoutIllustrations)
          : {};
      setCompiledData(sections, illustrations);

      if (data.customTexts) {
        const store = useHandoutStore.getState();
        if (data.customTexts.headerText) store.setCustomHeaderText(data.customTexts.headerText);
        if (data.customTexts.analysisTitleText)
          store.setAnalysisTitleText(data.customTexts.analysisTitleText);
        if (data.customTexts.summaryTitleText)
          store.setSummaryTitleText(data.customTexts.summaryTitleText);
      }

      return {
        id: data.id,
        title: data.title,
        level: data.level,
        model: data.model,
      };
    },
  });

  // Load user template settings
  const templateQuery = useQuery<TemplateSettings>({
    queryKey: ["templateSettings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/template-settings");
      if (!res.ok) return DEFAULT_TEMPLATE_SETTINGS;
      return res.json() as Promise<TemplateSettings>;
    },
  });

  // Apply saved template settings only once per mount to avoid overriding
  // manual changes when templateQuery refetches (e.g., window refocus).
  const didApplyTemplateRef = useRef(false);
  useEffect(() => {
    if (templateQuery.data && !didApplyTemplateRef.current) {
      didApplyTemplateRef.current = true;
      useTemplateSettingsStore.getState().loadSettings(templateQuery.data);

      // Apply default texts only for new handouts (not saved ones)
      if (!handoutId) {
        const t = templateQuery.data;
        const hs = useHandoutStore.getState();
        if (t.defaultHeaderText) hs.setCustomHeaderText(t.defaultHeaderText);
        if (t.defaultAnalysisTitle) hs.setAnalysisTitleText(t.defaultAnalysisTitle);
        if (t.defaultSummaryTitle) hs.setSummaryTitleText(t.defaultSummaryTitle);
      }
    }
  }, [templateQuery.data, handoutId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const state = useHandoutStore.getState();
      const sections: Record<string, string> = {};
      for (const [id, section] of Object.entries(state.sections)) {
        sections[id] = section.rawText;
      }

      let inputHash: string | undefined;
      try {
        const stored = sessionStorage.getItem(INPUT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { passages?: string[] };
          if (Array.isArray(parsed.passages)) {
            inputHash = await hashPassages(parsed.passages);
          }
        }
      } catch {
        // hash failure is non-critical
      }

      let level = "advanced";
      let model = "pro";
      try {
        const storedInput = sessionStorage.getItem(INPUT_STORAGE_KEY);
        if (storedInput) {
          const p = JSON.parse(storedInput) as { level?: string; model?: string };
          if (typeof p.level === "string") level = p.level;
          if (typeof p.model === "string") model = p.model;
        }
      } catch {
        // fallback to defaults
      }

      const body = {
        title: saveTitle.trim() || `Handout ${new Date().toLocaleDateString("en-US")}`,
        sections,
        level,
        model,
        inputHash,
        illustrations: state.illustrations,
        customTexts: {
          headerText: state.customHeaderText,
          analysisTitleText: state.analysisTitleText,
          summaryTitleText: state.summaryTitleText,
        },
      };

      const res = await fetch("/api/handouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save handout.");
      return res.json();
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const inputQuery = useQuery<CompileInputData | null>({
    queryKey: ["compile", "input"],
    staleTime: 0,
    gcTime: Infinity,
    queryFn: async () => {
      const stored = sessionStorage.getItem(INPUT_STORAGE_KEY);
      if (!stored) return null;

      try {
        const parsed = JSON.parse(stored) as { passages?: unknown; timestamp?: unknown };
        if (!Array.isArray(parsed.passages)) return null;

        const payloadAge =
          typeof parsed.timestamp === "string"
            ? Date.now() - new Date(parsed.timestamp).getTime()
            : Number.NaN;
        if (!Number.isFinite(payloadAge) || payloadAge > INPUT_MAX_AGE_MS) {
          sessionStorage.removeItem(INPUT_STORAGE_KEY);
          return null;
        }

        const passages = parsed.passages.filter(
          (item): item is string => typeof item === "string"
        );
        if (passages.length === 0) return null;

        const hash = await hashPassages(passages);
        const fullParsed = JSON.parse(stored) as { level?: string; model?: string };

        return {
          passages,
          hash,
          level: typeof fullParsed.level === "string" ? fullParsed.level : "advanced",
          model: typeof fullParsed.model === "string" ? fullParsed.model : "pro",
        };
      } catch (error) {
        console.error("Failed to parse compile input", error);
        return null;
      }
    },
  });

  const compileQuery = useQuery<{ hash: string }>({
    queryKey: ["compile", "bootstrap", inputQuery.data?.hash],
    enabled: Boolean(inputQuery.data?.hash),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const input = inputQuery.data;
      if (!input) {
        throw new Error("Input data not found.");
      }

      const compiledKey = `${COMPILED_PREFIX}${input.hash}`;
      const cachedCompiled = sessionStorage.getItem(compiledKey);

      if (cachedCompiled) {
        const parsed = JSON.parse(cachedCompiled) as CompiledHandout;
        setCompiledData(parsed.sections, parsed.illustrations ?? {});
        return { hash: input.hash };
      }

      let cachedResult = getCachedResult(input.hash);
      if (!cachedResult) {
        const response = await generatePassages(input.passages);
        setCachedResult(input.hash, response.results);
        cachedResult = {
          version: 2,
          results: response.results,
          createdAt: new Date().toISOString(),
        };
      }

      setCompiledData(createInitialSections(cachedResult.results), {});
      return { hash: input.hash };
    },
  });

  useEffect(() => {
    if (!isExportingPdf) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "PDF export is in progress. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isExportingPdf]);

  const { handleApplyTemplate, handleCopyAll, handleDownloadTxt, handleExportPDF } =
    useCompileActions({
      hash: compileQuery.data?.hash,
      setApplying,
      setProgress,
      updateSection,
      setIsExportingPdf,
      setExportProgress,
    });

  const handleSave = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleSaveConfirm = useCallback(() => {
    setShowSaveModal(false);
    saveMutation.mutate();
  }, [saveMutation]);

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
          throw new Error(runData?.error?.message || "삽화 생성 실행 중 오류가 발생했습니다.");
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
          throw new Error("삽화 생성 시간이 10분을 초과했습니다. 잠시 후 다시 시도해주세요.");
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
        setIllustrationMessage("저장된 교안(handout)에서만 삽화를 생성할 수 있습니다.");
        return;
      }

      const payload: IllustrationApplyOptions = {
        scope: options?.scope ?? "all",
        quality: options?.quality ?? "standard",
        overwritePolicy: options?.overwritePolicy ?? "skip_completed",
        conceptMode: options?.conceptMode ?? "off",
        conceptText: options?.conceptText,
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
          }),
        });
        const createData = await createRes.json().catch(() => ({}));

        if (createRes.status === 409) {
          const conflictedJobId = createData?.error?.jobId;
          if (typeof conflictedJobId === "string" && conflictedJobId.length > 0) {
            setIllustrationJobId(conflictedJobId);
            setIllustrationMessage("이미 진행 중인 삽화 작업을 이어서 진행합니다.");
            const finalStatus = await runIllustrationLoop(conflictedJobId);
            if (finalStatus === "completed") {
              setIllustrationMessage("삽화 생성이 완료되었습니다.");
            } else if (finalStatus === "partial_failed") {
              setIllustrationMessage(
                "일부 삽화 생성에 실패했습니다. 재시도를 진행해주세요."
              );
            } else {
              setIllustrationMessage("삽화 생성이 중단되었거나 실패했습니다.");
            }
            return;
          }
        }

        if (!createRes.ok) {
          const detail =
            createData?.error?.message ??
            "삽화 작업을 생성하지 못했습니다. 크레딧을 확인해주세요.";
          throw new Error(detail);
        }

        const job = createData?.job as IllustrationJobProgress | undefined;
        const jobId =
          typeof createData.jobId === "string" ? createData.jobId : createData?.job?.id;
        if (!jobId) {
          throw new Error("삽화 작업 ID를 받지 못했습니다.");
        }
        if (job) {
          setIllustrationProgress(toIllustrationProgress(job));
        }
        setIllustrationJobId(jobId);
        const finalStatus = await runIllustrationLoop(jobId);

        if (finalStatus === "completed") {
          setIllustrationMessage("삽화 생성이 완료되었습니다.");
        } else if (finalStatus === "partial_failed") {
          setIllustrationMessage("일부 삽화 생성에 실패했습니다. 재시도를 진행해주세요.");
        } else {
          setIllustrationMessage("삽화 생성이 중단되었거나 실패했습니다.");
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
        throw new Error(cancelData?.error?.message || "삽화 작업 취소에 실패했습니다.");
      }

      const job = cancelData?.job as IllustrationJobProgress | undefined;
      if (job) {
        setIllustrationProgress(toIllustrationProgress(job));
      } else {
        setIllustrationProgress((prev) => ({ ...prev, status: "canceled" }));
      }
      await syncHandoutIllustrations();
      setIllustrationMessage("삽화 작업이 취소되었습니다. 미사용 크레딧은 환불 처리됩니다.");
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
        setIllustrationMessage("재시도 후 삽화 생성이 완료되었습니다.");
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
        setIllustrationMessage("진행 중인 삽화 작업을 이어서 진행합니다.");
        setIsApplyingIllustrations(true);
        const finalStatus = await runIllustrationLoop(activeJob.id);
        if (cancelled) return;

        if (finalStatus === "completed") {
          setIllustrationMessage("삽화 생성이 완료되었습니다.");
        } else if (finalStatus === "partial_failed") {
          setIllustrationMessage("일부 삽화 생성에 실패했습니다. 재시도를 진행해주세요.");
        } else {
          setIllustrationMessage("삽화 생성이 중단되었거나 실패했습니다.");
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

  const isLoading =
    handoutQuery.isLoading ||
    inputQuery.isLoading ||
    (inputQuery.data !== null && inputQuery.data !== undefined && compileQuery.isLoading);

  const errorMessage = useMemo(() => {
    if (inputQuery.error) {
      return inputQuery.error.message;
    }
    if (compileQuery.error) {
      return compileQuery.error.message;
    }
    return null;
  }, [compileQuery.error, inputQuery.error]);

  return {
    handoutId,
    inputData: inputQuery.data,
    isLoading,
    errorMessage,
    isExportingPdf,
    exportProgress,
    saveSuccess,
    showSaveModal,
    saveTitle,
    setSaveTitle,
    setShowSaveModal,
    isSaving: saveMutation.isPending,
    isApplyingIllustrations,
    illustrationJobId,
    illustrationProgress,
    illustrationMessage,
    handleApplyTemplate,
    handleApplyIllustrations,
    handleRetryIllustrations,
    handleCancelIllustrations,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
    handleSave,
    handleSaveConfirm,
    activeSample: activeSampleQuery.data ?? null,
  };
}
