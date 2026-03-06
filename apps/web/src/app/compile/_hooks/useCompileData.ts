"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { generatePassages } from "@/services/api";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
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

export function useCompileData() {
  const searchParams = useSearchParams();
  const handoutId = searchParams.get("handoutId");

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const setCompiledData = useHandoutStore((state) => state.setCompiledData);
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
      if (!res.ok) throw new Error("교안을 불러오지 못했습니다.");
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
      setCompiledData(sections);

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

  useEffect(() => {
    if (templateQuery.data) {
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
        title: saveTitle.trim() || `교안 ${new Date().toLocaleDateString("ko-KR")}`,
        sections,
        level,
        model,
        inputHash,
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
      if (!res.ok) throw new Error("교안 저장에 실패했습니다.");
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
        throw new Error("입력 데이터를 찾을 수 없습니다.");
      }

      const compiledKey = `${COMPILED_PREFIX}${input.hash}`;
      const cachedCompiled = sessionStorage.getItem(compiledKey);

      if (cachedCompiled) {
        const parsed = JSON.parse(cachedCompiled) as CompiledHandout;
        setCompiledData(parsed.sections);
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

      setCompiledData(createInitialSections(cachedResult.results));
      return { hash: input.hash };
    },
  });

  useEffect(() => {
    if (!isExportingPdf) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "PDF 내보내기가 진행 중입니다. 페이지를 떠나시겠습니까?";
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
    handleApplyTemplate,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
    handleSave,
    handleSaveConfirm,
  };
}
