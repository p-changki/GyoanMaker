"use client";

import { useMemo } from "react";
import type { VocabBankConfig, VocabBankData, VocabBankItem } from "@gyoanmaker/shared/types";
import VocabBankSheet from "./VocabBankSheet";

interface VocabBankSheetsForCompileProps {
  vocabBankData: VocabBankData;
  config: VocabBankConfig;
  startOrder: number;
}

const ITEMS_PER_PAGE = 50;
const PAGE_SHADOW = "0 25px 50px -12px rgba(0,0,0,0.25)";

function chunkItems(items: VocabBankItem[]): VocabBankItem[][] {
  if (items.length === 0) return [];

  const pages: VocabBankItem[][] = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }
  return pages;
}

export function getVocabBankPageCount(itemCount: number): number {
  if (itemCount <= 0) return 0;
  return Math.ceil(itemCount / ITEMS_PER_PAGE);
}

export default function VocabBankSheetsForCompile({
  vocabBankData,
  config,
  startOrder,
}: VocabBankSheetsForCompileProps) {
  const pages = useMemo(() => chunkItems(vocabBankData.items), [vocabBankData.items]);

  return (
    <div className="flex flex-col gap-6">
      {pages.map((pageItems, index) => {
        const order = startOrder + index + 1;
        const startIndex = index * ITEMS_PER_PAGE;

        return (
          <div
            key={`compile-vocab-bank-${index}`}
            data-pdf-part={`vocab-bank-${index}`}
            data-pdf-order={order}
            className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
            style={{ boxShadow: PAGE_SHADOW }}
          >
            <VocabBankSheet
              items={pageItems}
              pageIndex={index}
              startIndex={startIndex}
              globalPageNumber={order}
              pageKey={`vocab-${index}`}
              config={config}
            />
          </div>
        );
      })}
    </div>
  );
}
