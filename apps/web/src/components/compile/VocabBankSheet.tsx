"use client";

import type { VocabBankConfig, VocabBankItem } from "@gyoanmaker/shared/types";
import { FONT_FAMILY_MAP, THEME_PRESETS } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useVocabBankStore } from "@/stores/useVocabBankStore";
import { EditableText } from "./EditableText";
import WorkbookPageShell from "./WorkbookPageShell";

const POS_KO_MAP: Record<string, string> = {
  "n.": "[명]",
  "v.": "[동]",
  "adj.": "[형]",
  "adv.": "[부]",
};

function posToKo(pos: string): string {
  return POS_KO_MAP[pos] ?? `[${pos}]`;
}

interface VocabBankSheetProps {
  items: VocabBankItem[];
  pageIndex: number;
  startIndex: number;
  globalPageNumber: number;
  pageKey?: string;
  config: VocabBankConfig;
}

function VocabColumn({
  items,
  startIndex,
  colors,
  updateItem,
}: {
  items: VocabBankItem[];
  startIndex: number;
  colors: { primary: string };
  updateItem: (index: number, updater: (item: VocabBankItem) => VocabBankItem) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ backgroundColor: `${colors.primary}18` }}>
          <th className="w-[36px] border-b border-gray-200 px-2 py-2 text-left text-[10px] font-black text-gray-600">
            No.
          </th>
          <th className="w-[40%] border-b border-gray-200 px-2 py-2 text-left text-[10px] font-black text-gray-600">
            단어
          </th>
          <th className="border-b border-gray-200 px-2 py-2 text-left text-[10px] font-black text-gray-600">
            뜻
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const absoluteIndex = startIndex + idx;
          return (
            <tr key={`${item.word}-${absoluteIndex}`} className="align-top">
              <td className="border-b border-gray-100 px-2 py-1.5 text-[10px] font-bold text-gray-400">
                {absoluteIndex + 1}
              </td>
              <td className="border-b border-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-900">
                <EditableText
                  as="span"
                  value={item.word}
                  label={`보카 단어 #${absoluteIndex + 1} 수정`}
                  themeColor={colors.primary}
                  maxLength={120}
                  onConfirm={(next) =>
                    updateItem(absoluteIndex, (prev) => ({ ...prev, word: next }))
                  }
                />
              </td>
              <td className="border-b border-gray-100 px-2 py-1.5 text-xs text-gray-800">
                <span className="font-bold text-gray-500 mr-0.5">
                  {posToKo(item.partOfSpeech)}
                </span>
                <EditableText
                  as="span"
                  value={item.meaningKo}
                  label={`보카 뜻 #${absoluteIndex + 1} 수정`}
                  themeColor={colors.primary}
                  maxLength={200}
                  onConfirm={(next) =>
                    updateItem(absoluteIndex, (prev) => ({
                      ...prev,
                      meaningKo: next,
                    }))
                  }
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function VocabBankSheet({
  items,
  pageIndex,
  startIndex,
  globalPageNumber,
  pageKey,
  config,
}: VocabBankSheetProps) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);

  const updateItem = useVocabBankStore((state) => state.updateItem);
  const updateConfig = useVocabBankStore((state) => state.updateConfig);

  const base = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...base, ...customColors } : base;
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;

  const midpoint = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, midpoint);
  const rightItems = items.slice(midpoint);

  return (
    <WorkbookPageShell
      sectionNumber={config.sheetCode}
      sectionTitle={config.sheetTitle || "VOCA"}
      stepBadge={config.rangeDescription || "Vocabulary"}
      stepLabel="수업 전 어휘 정리"
      globalPageNumber={globalPageNumber}
      pageKey={pageKey}
      showBanner={pageIndex === 0}
      badgeSectionKey="vocabBank"
      onEditSectionTitle={(v) => updateConfig({ sheetTitle: v })}
      onEditStepBadge={(v) => updateConfig({ rangeDescription: v })}
    >
      <div className="flex h-full flex-col" style={{ fontFamily: fontCss }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <VocabColumn
              items={leftItems}
              startIndex={startIndex}
              colors={colors}
              updateItem={updateItem}
            />
          </div>
          {rightItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <VocabColumn
                items={rightItems}
                startIndex={startIndex + midpoint}
                colors={colors}
                updateItem={updateItem}
              />
            </div>
          )}
        </div>

        {config.teacherName && (
          <p
            className="mt-4 text-right font-semibold text-gray-500"
            style={{ fontSize: `${fontSizes.pageFooter - 1}px` }}
          >
            <EditableText
              as="span"
              value={config.teacherName}
              label="교사명 수정"
              themeColor={colors.primary}
              maxLength={40}
              onConfirm={(v) => updateConfig({ teacherName: v })}
            />
          </p>
        )}
      </div>
    </WorkbookPageShell>
  );
}
