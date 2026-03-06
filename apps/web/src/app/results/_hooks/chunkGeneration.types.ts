import {
  ContentLevel,
  InputMode,
  ModelTier,
  OutputOptionState,
  PassageInput,
} from "@gyoanmaker/shared/types";

export const SESSION_STORAGE_KEY = "gyoanmaker:input";
export const INPUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const CHUNK_CONCURRENCY = 1;
export const INITIAL_GENERATE_CHUNK_SIZE = 1;
export const FLASH_CHUNK_CONCURRENCY = 2;
export const FLASH_GENERATE_CHUNK_SIZE = 3;

export type ResultStatus = "pending" | "generating" | "completed" | "failed";

export interface SessionInputData {
  inputMode: InputMode;
  textBlock?: string;
  cards?: PassageInput[];
  passages: string[];
  options: OutputOptionState;
  level: ContentLevel;
  model: ModelTier;
  timestamp: string;
}

export interface ResultItem {
  id: string;
  index: number;
  status: ResultStatus;
  outputText: string;
  error?: string;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export interface ChunkMetrics {
  total: number;
  completed: number;
  failed: number;
  generating: number;
  processed: number;
  progressPercent: number;
  etaLabel: string | null;
  failedIds: string;
}

export function formatEta(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const remain = seconds % 60;

  if (mins <= 0) {
    return `${remain}초`;
  }

  return `${mins}분 ${remain}초`;
}
