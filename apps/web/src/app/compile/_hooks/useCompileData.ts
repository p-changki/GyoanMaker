"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { hashPassages } from "@/services/cache";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { INPUT_STORAGE_KEY } from "./compileData.constants";
import { useCompileActions } from "./useCompileActions";
import { useHandoutLoader } from "./useHandoutLoader";
import { useIllustrationManager } from "./useIllustrationManager";

export function useCompileData() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const setApplying = useHandoutStore((state) => state.setApplying);
  const setProgress = useHandoutStore((state) => state.setProgress);
  const updateSection = useHandoutStore((state) => state.updateSection);

  const { handoutId, handoutQuery, inputQuery, compileQuery, isLoading } = useHandoutLoader();

  const illustration = useIllustrationManager(handoutId);

  useEffect(() => {
    if (!isExportingPdf) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const state = useHandoutStore.getState();
      const sections: Record<string, string> = {};
      for (const [id, section] of Object.entries(state.sections)) {
        sections[id] = section.rawText;
      }

      const existingId = searchParams.get("handoutId");

      // If handout already saved, update instead of creating duplicate
      if (existingId) {
        const body = {
          title: saveTitle.trim() || undefined,
          sections,
          illustrations: state.illustrations,
          customTexts: {
            headerText: state.customHeaderText,
            analysisTitleText: state.analysisTitleText,
            summaryTitleText: state.summaryTitleText,
          },
        };

        const res = await fetch(`/api/handouts/${existingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update handout.");
        return { id: existingId, updated: true };
      }

      // New handout — create
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
    onSuccess: (data: { id?: string; updated?: boolean }) => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Add handoutId to URL so illustration apply becomes active
      if (data?.id && !searchParams.get("handoutId")) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("handoutId", data.id);
        router.replace(`/compile?${params.toString()}`, { scroll: false });
      }
    },
  });

  const handleSave = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleSaveConfirm = useCallback(() => {
    setShowSaveModal(false);
    saveMutation.mutate();
  }, [saveMutation]);

  const errorMessage = useMemo(() => {
    if (handoutQuery.error) {
      return handoutQuery.error.message;
    }
    if (inputQuery.error) {
      return inputQuery.error.message;
    }
    if (compileQuery.error) {
      return compileQuery.error.message;
    }
    return null;
  }, [handoutQuery.error, compileQuery.error, inputQuery.error]);

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
    isApplyingIllustrations: illustration.isApplyingIllustrations,
    illustrationJobId: illustration.illustrationJobId,
    illustrationProgress: illustration.illustrationProgress,
    illustrationMessage: illustration.illustrationMessage,
    illustrationCreditError: illustration.illustrationCreditError,
    setIllustrationCreditError: illustration.setIllustrationCreditError,
    handleApplyTemplate,
    handleApplyIllustrations: illustration.handleApplyIllustrations,
    handleRetryIllustrations: illustration.handleRetryIllustrations,
    handleCancelIllustrations: illustration.handleCancelIllustrations,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
    handleSave,
    handleSaveConfirm,
    activeSample: illustration.activeSample,
  };
}
