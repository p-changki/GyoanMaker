"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { generatePassages } from "@/services/api";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
import type {
  HandoutIllustrations,
  TemplateSettings,
  VocabBankData,
  WorkbookData,
} from "@gyoanmaker/shared/types";
import { getCachedResult, hashPassages, setCachedResult } from "@/services/cache";
import {
  DEFAULT_ANALYSIS_TITLE_TEXT,
  DEFAULT_CUSTOM_HEADER_TEXT,
  DEFAULT_SUMMARY_TITLE_TEXT,
  useHandoutStore,
} from "@/stores/useHandoutStore";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useVocabBankStore } from "@/stores/useVocabBankStore";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { DEFAULT_TEMPLATE_SETTINGS } from "@gyoanmaker/shared/types";
import {
  COMPILED_PREFIX,
  INPUT_MAX_AGE_MS,
  INPUT_STORAGE_KEY,
  type CompileInputData,
  createInitialSections,
} from "./compileData.constants";

interface CompileInitResponse {
  handout: {
    id: string;
    title: string;
    level: string;
    model: string;
    sections: Record<string, string>;
    illustrations?: HandoutIllustrations;
    workbook?: WorkbookData | null;
    vocabBank?: VocabBankData | null;
    customTexts?: {
      headerText?: string;
      analysisTitleText?: string;
      analysisTitleTexts?: Record<string, string>;
      summaryTitleText?: string;
    };
  };
  templateSettings: TemplateSettings;
}

function isCompileInitResponse(value: unknown): value is CompileInitResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CompileInitResponse>;
  return Boolean(candidate.handout && candidate.templateSettings);
}

function buildSectionsFromHandout(
  sectionsPayload: CompileInitResponse["handout"]["sections"]
): Record<string, HandoutSection> {
  const sections: Record<string, HandoutSection> = {};
  for (const [id, rawText] of Object.entries(sectionsPayload)) {
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
  return sections;
}

export function useHandoutLoader() {
  const searchParams = useSearchParams();
  const handoutId = searchParams.get("handoutId");
  const queryClient = useQueryClient();

  // Invalidate template settings on mount so manual edits don't persist across navigations
  // Only relevant for new handout flow (saved handouts use the combined endpoint)
  const didInvalidateRef = useRef(false);
  useEffect(() => {
    if (!didInvalidateRef.current) {
      didInvalidateRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["templateSettings"] });
    }
  }, [queryClient]);

  const setCompiledData = useHandoutStore((state) => state.setCompiledData);
  const setWorkbookData = useWorkbookStore((state) => state.setWorkbookData);
  const setVocabBankData = useVocabBankStore((state) => state.setVocabBankData);

  // ── Saved handout: combined endpoint (handout + template in one request) ──

  const compileInitQuery = useQuery<CompileInitResponse>({
    queryKey: ["compile-init", handoutId],
    enabled: Boolean(handoutId),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const res = await fetch(`/api/compile/init/${handoutId}`);
      if (!res.ok) throw new Error("Failed to load handout.");
      return (await res.json()) as CompileInitResponse;
    },
  });
  const compileInitData = compileInitQuery.data;
  const isCompileInitSuccess = compileInitQuery.isSuccess;
  const isCompileInitFetching = compileInitQuery.isFetching;
  const refetchCompileInit = compileInitQuery.refetch;

  useEffect(() => {
    if (!isCompileInitSuccess || isCompileInitFetching) return;

    const initData = compileInitData;
    if (!isCompileInitResponse(initData)) {
      void refetchCompileInit();
      return;
    }

    const sections = buildSectionsFromHandout(initData.handout.sections);
    const illustrations =
      initData.handout.illustrations && typeof initData.handout.illustrations === "object"
        ? initData.handout.illustrations
        : {};
    setCompiledData(sections, illustrations);

    const store = useHandoutStore.getState();
    store.setCustomHeaderText(
      initData.handout.customTexts?.headerText || DEFAULT_CUSTOM_HEADER_TEXT
    );
    store.setAnalysisTitleText(
      initData.handout.customTexts?.analysisTitleText || DEFAULT_ANALYSIS_TITLE_TEXT
    );
    if (initData.handout.customTexts?.analysisTitleTexts) {
      for (const [pid, text] of Object.entries(initData.handout.customTexts.analysisTitleTexts)) {
        store.setPassageAnalysisTitleText(pid, text);
      }
    }
    store.setSummaryTitleText(
      initData.handout.customTexts?.summaryTitleText || DEFAULT_SUMMARY_TITLE_TEXT
    );

    useTemplateSettingsStore.getState().loadSettings(initData.templateSettings);

    const handoutModel = initData.handout.model === "flash" ? "flash" : "pro" as const;
    useHandoutStore.getState().setHandoutModel(handoutModel);

    const workbook = initData.handout.workbook ?? null;
    if (workbook) {
      setWorkbookData(workbook);
    } else {
      useWorkbookStore.setState({ workbookData: null });
    }

    const vocabBank = initData.handout.vocabBank ?? null;
    if (vocabBank) {
      setVocabBankData(vocabBank);
      return;
    }
    useVocabBankStore.setState({ vocabBankData: null });
  }, [
    compileInitData,
    isCompileInitSuccess,
    isCompileInitFetching,
    refetchCompileInit,
    setCompiledData,
    setVocabBankData,
    setWorkbookData,
  ]);

  // ── New handout: standalone template query ──

  const templateQuery = useQuery<TemplateSettings>({
    queryKey: ["templateSettings"],
    enabled: !handoutId,
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

  // ── New handout: input from sessionStorage ──

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

      const inputModel = input.model === "flash" ? "flash" : "pro" as const;
      useHandoutStore.getState().setHandoutModel(inputModel);

      const compiledKey = `${COMPILED_PREFIX}${input.hash}`;
      const cachedCompiled = sessionStorage.getItem(compiledKey);

      if (cachedCompiled) {
        const parsed = JSON.parse(cachedCompiled) as CompiledHandout;
        const sectionCount = Object.keys(parsed.sections).length;

        // Discard stale compiled cache if section count does not match input
        if (sectionCount === input.passages.length) {
          setCompiledData(parsed.sections, parsed.illustrations ?? {});
          return { hash: input.hash };
        }
        sessionStorage.removeItem(compiledKey);
      }

      let cachedResult = getCachedResult(input.hash);

      // Discard partial result cache if it has fewer results than input passages
      if (cachedResult && cachedResult.results.length < input.passages.length) {
        cachedResult = null;
      }

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

  const isLoading =
    compileInitQuery.isLoading ||
    (!handoutId && inputQuery.isLoading) ||
    (!handoutId && inputQuery.data !== null && inputQuery.data !== undefined && compileQuery.isLoading);

  return {
    handoutId,
    handoutQuery: compileInitQuery,
    inputQuery,
    compileQuery,
    isLoading,
  };
}
