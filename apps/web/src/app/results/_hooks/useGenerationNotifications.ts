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
        message: `교안 생성 완료 (${completedCount}건 성공, ${failedCount}건 실패)`,
        type: "error",
      });
      sendBrowserNotification("교안 생성 완료", {
        body: `${completedCount}건 성공, ${failedCount}건 실패`,
      });
      return;
    }

    setToast({
      message: `교안 ${completedCount}건 생성이 완료되었습니다!`,
      type: "success",
    });
    sendBrowserNotification("교안 생성 완료", {
      body: `${completedCount}건 생성이 완료되었습니다!`,
    });
  }, [hasNotifiedRef, hasStartedRef, results, setToast]);
}
