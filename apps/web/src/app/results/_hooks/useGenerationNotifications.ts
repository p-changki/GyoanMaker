"use client";

import { Dispatch, MutableRefObject, SetStateAction, useEffect } from "react";
import { sendBrowserNotification } from "@/lib/notifications";
import { ResultItem, ToastState } from "./chunkGeneration.types";

interface UseGenerationNotificationsParams {
  results: ResultItem[];
  hasStartedRef: MutableRefObject<boolean>;
  hasNotifiedRef: MutableRefObject<boolean>;
  setToast: Dispatch<SetStateAction<ToastState | null>>;
}

export function useGenerationNotifications({
  results,
  hasStartedRef,
  hasNotifiedRef,
  setToast,
}: UseGenerationNotificationsParams) {
  useEffect(() => {
    if (results.length === 0 || hasNotifiedRef.current) return;

    const generatingCount = results.filter((r) => r.status === "generating").length;
    if (generatingCount > 0 || !hasStartedRef.current) {
      return;
    }

    hasNotifiedRef.current = true;

    const completedCount = results.filter((r) => r.status === "completed").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    if (failedCount > 0) {
      setToast({
        message: `Handout generation complete (${completedCount} succeeded, ${failedCount} failed)`,
        type: "error",
      });
      sendBrowserNotification("Handout Generation Complete", {
        body: `${completedCount} succeeded, ${failedCount} failed`,
      });
      return;
    }

    setToast({
      message: `${completedCount} handout(s) generated successfully!`,
      type: "success",
    });
    sendBrowserNotification("Handout Generation Complete", {
      body: `${completedCount} handout(s) generated!`,
    });
  }, [hasNotifiedRef, hasStartedRef, results, setToast]);
}
