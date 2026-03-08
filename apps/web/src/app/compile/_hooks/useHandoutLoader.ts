"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { generatePassages } from "@/services/api";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
import type { HandoutIllustrations } from "@gyoanmaker/shared/types";
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

export function useHandoutLoader() {
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

  const setCompiledData = useHandoutStore((state) => state.setCompiledData);

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
    handoutQuery.isLoading ||
    inputQuery.isLoading ||
    (inputQuery.data !== null && inputQuery.data !== undefined && compileQuery.isLoading);

  return {
    handoutId,
    handoutQuery,
    inputQuery,
    compileQuery,
    isLoading,
  };
}
