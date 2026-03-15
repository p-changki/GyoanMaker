"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WorkbookStep3Item } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { EditableText } from "@/components/compile/EditableText";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];

/** Determine banner level from warnings attached to step3 items */
function getStep3BannerLevel(
  items: FlatStep3Item[]
): "pass" | "caution" | "error" {
  const allWarnings = items.flatMap((item) => item.warnings ?? []);
  if (allWarnings.length === 0) return "pass";
  if (allWarnings.some((w) => w.severity === "error")) return "error";
  return "caution";
}

const BANNER_CONFIG = {
  pass: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "✏️",
    iconColor: "text-gray-400",
    textColor: "text-gray-500",
    message: "AI 생성 초안입니다. 정답과 순서를 확인해주세요.",
  },
  caution: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "⚠",
    iconColor: "text-amber-500",
    textColor: "text-amber-700",
    message: "일부 세그먼트에 품질 경고가 있습니다. 검수 후 사용해주세요.",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "⛔",
    iconColor: "text-red-500",
    textColor: "text-red-700",
    message:
      "중복 세그먼트 등 심각한 문제가 발견되었습니다. 검수 또는 재생성을 권장합니다.",
  },
} as const;

/** Flat step3 item with passageId attached for store updates */
export interface FlatStep3Item extends WorkbookStep3Item {
  passageId: string;
}

interface CompileStep3ContentProps {
  items: FlatStep3Item[];
  /** Global starting index (0-based) for continuous numbering */
  startIndex: number;
  /** PassageId to target when adding an empty item in the empty state */
  defaultPassageId?: string;
}

// --- Sortable paragraph drag item ---

interface SortableParagraphProps {
  paragraph: { label: string; text: string };
  bodyFontPt: number;
  themeColor: string;
  onConfirmText: (label: string, newText: string) => void;
}

function SortableParagraph({
  paragraph,
  bodyFontPt,
  themeColor,
  onConfirmText,
}: SortableParagraphProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: paragraph.label });

  const containerStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: "flex",
    alignItems: "flex-start",
  };

  return (
    <div ref={setNodeRef} style={containerStyle}>
      {/* Drag handle — hidden in PDF export */}
      <span
        {...attributes}
        {...listeners}
        data-html2canvas-ignore="true"
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none"
        style={{
          fontSize: `${bodyFontPt}pt`,
          lineHeight: 2.1,
          marginRight: "4px",
          marginTop: "1px",
        }}
        title="드래그하여 순서 변경"
      >
        ⠿
      </span>
      <EditableText
        value={`(${paragraph.label}) ${paragraph.text}`}
        label={`블록 ${paragraph.label} 수정`}
        multiline
        maxLength={3000}
        as="p"
        themeColor={themeColor}
        style={{
          margin: "0 0 6px",
          fontSize: `${bodyFontPt}pt`,
          lineHeight: 2.1,
          textAlign: "justify",
          textIndent: "-1.6em",
          paddingLeft: "1.6em",
          color: "#111827",
          flex: 1,
        }}
        onConfirm={(next) =>
          onConfirmText(paragraph.label, next.replace(/^\([A-D]\)\s*/, ""))
        }
      />
    </div>
  );
}

// --- Empty step3 item factory ---

function createEmptyStep3Item(questionNumber: number, passageId: string): WorkbookStep3Item {
  const match = passageId.match(/\d+/);
  const passageNumber = match ? parseInt(match[0], 10) : 1;
  return {
    questionNumber,
    passageNumber,
    type: "3p",
    intro: "",
    paragraphs: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
    ],
    options: [
      ["A", "B", "C"],
      ["A", "C", "B"],
      ["B", "A", "C"],
      ["B", "C", "A"],
      ["C", "B", "A"],
    ],
    answerIndex: 0,
  };
}

// --- Main component ---

export default function CompileStep3Content({
  items,
  startIndex,
  defaultPassageId,
}: CompileStep3ContentProps) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const page1BodyStyle = useTemplateSettingsStore((s) => s.page1BodyStyle);

  const base = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...base, ...customColors } : base;
  const fontCss = page1BodyStyle?.fontFamily
    ? FONT_FAMILY_MAP[page1BodyStyle.fontFamily].css
    : FONT_FAMILY_MAP[fontFamily].css;

  // Match handout analysisEn: same pt unit, same line-height 2.1
  const bodyFontPt = fontSizes.analysisEn ?? 10;

  const updateStep3Item = useWorkbookStore((state) => state.updateStep3Item);
  const reorderStep3Paragraphs = useWorkbookStore((state) => state.reorderStep3Paragraphs);
  const setStep3AnswerIndex = useWorkbookStore((state) => state.setStep3AnswerIndex);
  const addStep3Item = useWorkbookStore((state) => state.addStep3Item);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleConfirmParagraphText = useCallback(
    (item: FlatStep3Item, label: string, newText: string) => {
      updateStep3Item(item.passageId, item.questionNumber, (prev) => ({
        ...prev,
        paragraphs: prev.paragraphs.map((p) =>
          p.label !== label ? p : { ...p, text: newText },
        ),
      }));
    },
    [updateStep3Item],
  );

  const handleDragEnd = useCallback(
    (item: FlatStep3Item, event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const sortedParagraphs = [...item.paragraphs].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
      const oldIndex = sortedParagraphs.findIndex((p) => p.label === active.id);
      const newIndex = sortedParagraphs.findIndex((p) => p.label === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedParagraphs, oldIndex, newIndex);
      // newLabelOrder: old labels in the new correct reading order
      reorderStep3Paragraphs(
        item.passageId,
        item.questionNumber,
        reordered.map((p) => p.label),
      );
    },
    [reorderStep3Paragraphs],
  );

  // --- Empty state ---
  if (items.length === 0) {
    return (
      <div style={{ fontFamily: fontCss }}>
        <div
          data-html2canvas-ignore="true"
          className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3"
        >
          <span className="text-blue-500 text-sm mt-0.5">ℹ</span>
          <p className="text-sm text-blue-700">
            8문장 미만 지문은 STEP 3가 생성되지 않습니다. 필요 시 직접 작성하거나 건너뛸 수 있습니다.
          </p>
        </div>
        {defaultPassageId && (
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={() => {
              const maxQ = items.reduce((max, it) => Math.max(max, it.questionNumber), 0);
              addStep3Item(defaultPassageId, createEmptyStep3Item(maxQ + 1, defaultPassageId));
            }}
            className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            + 문항 추가
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: fontCss }}>
      {/* AI draft review banner — severity-based, hidden in PDF */}
      {(() => {
        const level = getStep3BannerLevel(items);
        const cfg = BANNER_CONFIG[level];
        if (!cfg) return null;
        return (
          <div
            data-html2canvas-ignore="true"
            className={`mb-4 flex items-start gap-2 rounded-lg ${cfg.bg} border ${cfg.border} px-4 py-3`}
          >
            <span className={`${cfg.iconColor} text-sm mt-0.5`}>{cfg.icon}</span>
            <p className={`text-sm ${cfg.textColor} font-medium`}>{cfg.message}</p>
          </div>
        );
      })()}

      {/* Instruction (only on first page) */}
      {startIndex === 0 && (
        <p
          style={{
            fontSize: `${bodyFontPt + 1}pt`,
            color: "#6B7280",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          ▶ 주어진 글 다음에 이어질 글의 순서로 가장 적절한 것을 고르시오.
        </p>
      )}

      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, idx) => {
          const sortedParagraphs = [...item.paragraphs].sort((a, b) =>
            a.label.localeCompare(b.label),
          );

          return (
            <li key={`s3-${startIndex + idx}`} style={{ marginBottom: "40px" }}>
              {/* Per-item warnings from backend — hidden in PDF */}
              {item.warnings && item.warnings.length > 0 && (
                <div
                  data-html2canvas-ignore="true"
                  className="mb-2 flex flex-wrap gap-1"
                >
                  {item.warnings.map((warning, wi) => (
                    <span
                      key={wi}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        warning.severity === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {warning.severity === "error" ? "⛔" : "⚠"} {warning.message}
                    </span>
                  ))}
                </div>
              )}

              {/* Question number */}
              <div
                style={{
                  fontSize: `${bodyFontPt + 1}pt`,
                  fontWeight: 900,
                  color: colors.primary,
                  marginBottom: "8px",
                }}
              >
                {startIndex + idx + 1}.
              </div>

              {/* Intro (lead sentence) */}
              <EditableText
                value={item.intro}
                label="STEP 3 도입문 수정"
                multiline
                maxLength={2000}
                as="p"
                themeColor={colors.primary}
                style={{
                  margin: "0 0 12px",
                  fontSize: `${bodyFontPt}pt`,
                  lineHeight: 2.1,
                  textAlign: "justify",
                  color: "#111827",
                }}
                onConfirm={(next) =>
                  updateStep3Item(item.passageId, item.questionNumber, (prev) => ({
                    ...prev,
                    intro: next,
                  }))
                }
              />

              {/* Paragraphs — draggable to reorder correct reading sequence */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(item, event)}
              >
                <SortableContext
                  items={sortedParagraphs.map((p) => p.label)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ marginBottom: "10px" }}>
                    {sortedParagraphs.map((paragraph) => (
                      <SortableParagraph
                        key={paragraph.label}
                        paragraph={paragraph}
                        bodyFontPt={bodyFontPt}
                        themeColor={colors.primary}
                        onConfirmText={(label, newText) =>
                          handleConfirmParagraphText(item, label, newText)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Options ①~⑤ with clickable answer selection */}
              <p
                style={{
                  margin: 0,
                  fontSize: `${bodyFontPt}pt`,
                  lineHeight: 2.0,
                  color: "#111827",
                }}
              >
                {item.options.map((option, optionIndex) => (
                  <span
                    key={`${startIndex + idx}-opt-${optionIndex}`}
                    style={{ marginRight: "14px" }}
                  >
                    {/* Click indicator — hidden in PDF */}
                    <span
                      data-html2canvas-ignore="true"
                      className={`inline-flex cursor-pointer mr-0.5 text-xs align-middle transition-colors ${
                        optionIndex === item.answerIndex
                          ? "text-green-600"
                          : "text-gray-300 hover:text-gray-500"
                      }`}
                      onClick={() =>
                        setStep3AnswerIndex(item.passageId, item.questionNumber, optionIndex)
                      }
                      title={
                        optionIndex === item.answerIndex ? "현재 정답" : "이 선택지를 정답으로 설정"
                      }
                    >
                      {optionIndex === item.answerIndex ? "●" : "○"}
                    </span>
                    {CIRCLE_NUMBERS[optionIndex]} ({option.join(")-(")}){" "}
                  </span>
                ))}
              </p>

              {/* Current answer summary — hidden in PDF */}
              <p
                data-html2canvas-ignore="true"
                className="mt-1 text-xs text-green-600 font-medium"
              >
                정답: {CIRCLE_NUMBERS[item.answerIndex]} (
                {item.options[item.answerIndex]?.join(" → ") ?? "?"}
                )
                <span className="ml-2 text-gray-400 font-normal">
                  ● 클릭으로 변경 · 단락을 드래그하면 순서 재배열
                </span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
