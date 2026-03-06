"use client";

import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { EditableAnalysisTitle, EditableSummaryTitleText } from "./EditableFields";
import { HandoutFooter, HandoutHeader } from "./HandoutHeader";

export function ParsedHandoutViewPage1({
  section,
  sentencesChunk,
  pageNum,
}: {
  section: HandoutSection;
  sentencesChunk: { en: string; ko: string }[];
  pageNum: number;
}) {
  return (
    <div className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative">
      <HandoutHeader section={section} />

      <section className="mb-8 relative flex-1 w-full">
        <div className="inline-flex items-center justify-center bg-white text-[#5E35B1] text-sm font-bold px-3 py-1.5 border border-[#5E35B1] rounded-full mb-3 z-10 relative leading-none">
          <span className="translate-y-px">
            <EditableAnalysisTitle pageNum={pageNum} />
          </span>
        </div>

        <div className="border-t-[3px] border-b-[3px] border-[#5E35B1] w-full">
          <div className="flex relative w-full">
            <div className="absolute top-0 right-0 w-[35%] h-full bg-[#FFE8E8]/50" />

            <div className="flex flex-col w-full relative z-10 divide-y divide-[#E5E7EB]">
              {sentencesChunk.map((pair, i) => (
                <div key={`${pair.en}-${pair.ko}-${i}`} className="flex min-h-[60px] w-full">
                  <div className="w-[65%] flex py-4 pr-6">
                    <div className="w-8 shrink-0 text-[14px] font-black text-[#5E35B1] pt-0.5">
                      {String((pageNum - 1) * 7 + i + 1).padStart(2, "0")}
                    </div>
                    <div
                      className="flex-1 text-[10pt] font-normal text-[#111827] leading-[2.1]"
                      style={{
                        fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
                      }}
                    >
                      {pair.en.replace(
                        /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴\s]+/,
                        ""
                      )}
                    </div>
                  </div>

                  <div className="w-[35%] py-4 pl-6 pr-4">
                    <div
                      className="text-[8pt] font-normal text-[#1F2937] leading-[2.1]"
                      style={{
                        fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
                      }}
                    >
                      {pair.ko.replace(
                        /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴\s]+/,
                        ""
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}

export function ParsedHandoutViewPage2({
  section,
  pageNum,
}: {
  section: HandoutSection;
  pageNum: number;
}) {
  return (
    <div className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative">
      <section className="mb-14 relative flex-1 w-full">
        <div
          className="relative mb-10 h-12 bg-[#5E35B1] rounded-r-xl flex items-center pr-10 w-[95%] mt-6"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          }}
        >
          <div className="absolute -top-[40px] left-6 w-[90px] h-[90px] z-20">
            {/* eslint-disable-next-line @next/next/no-img-element -- PDF canvas preview, next/image optimization unnecessary */}
            <img
              src="/images/avatar.png"
              alt="Teacher Avatar"
              className="w-full h-full object-contain"
              style={{
                filter:
                  "drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))",
              }}
            />
          </div>
          <span
            className="text-white text-[15px] font-black tracking-wide ml-32 z-30"
            style={{ fontFamily: "GmarketSans, sans-serif" }}
          >
            <EditableSummaryTitleText />
          </span>
        </div>

        <div className="space-y-8 pl-2">
          <div>
            <div
              className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            >
              <h3
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: "GmarketSans, sans-serif" }}
              >
                주제
              </h3>
            </div>
            <div className="pl-1">
              <p className="text-[10pt] font-bold text-[#111827] mb-1 leading-relaxed">
                {section.topic.en}
              </p>
              <p className="text-[8pt] font-medium text-[#374151] tracking-tight">
                {section.topic.ko}
              </p>
            </div>
          </div>

          {section.summary?.en && (
            <div>
              <div
                className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
                style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
              >
                <h3
                  className="text-[13px] font-bold text-white leading-none"
                  style={{ fontFamily: "GmarketSans, sans-serif" }}
                >
                  요약
                </h3>
              </div>
              <div className="pl-1">
                <p className="text-[10pt] font-normal text-[#111827] mb-1 leading-relaxed">
                  {section.summary.en}
                </p>
                <p className="text-[8pt] font-medium text-[#374151] tracking-tight">
                  {section.summary.ko}
                </p>
              </div>
            </div>
          )}

          <div>
            <div
              className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            >
              <h3
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: "GmarketSans, sans-serif" }}
              >
                내용 정리
              </h3>
            </div>
            <div className="pl-1 space-y-2">
              {section.flow.map((step) => (
                <div
                  key={step.text}
                  className="bg-[#FFE8E8]/60 px-3 py-2 rounded-md text-[11.5px] font-bold text-[#1F2937] text-center"
                >
                  {step.text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            >
              <h3
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: "GmarketSans, sans-serif" }}
              >
                핵심 어휘
              </h3>
            </div>

            <table className="w-full text-left border-collapse border-t-[3px] border-b-[3px] border-[#5E35B1]">
              <thead>
                <tr
                  className="bg-[#5E35B1] text-white text-[11.5px] font-bold"
                  style={{ fontFamily: "GmarketSans, sans-serif" }}
                >
                  <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">핵심 어휘</th>
                  <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">뜻</th>
                  <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">유의어</th>
                  <th className="px-3 py-2 w-[25%]">반의어</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {section.vocabulary
                  .filter((vocab) => vocab.word !== "핵심 어휘 및 확장")
                  .map((vocab, index) => (
                    <tr
                      key={`${vocab.word}-${vocab.meaning}`}
                      className={`border-b border-[#5E35B1]/20 text-[11.5px] ${index % 2 === 1 ? "bg-[#F9FAFB]/50" : ""}`}
                    >
                      <td className="px-3 py-2 text-[#111827] font-bold border-r border-[#5E35B1]/20">
                        {vocab.word}
                      </td>
                      <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-[#5E35B1]/20">
                        {vocab.meaning}
                      </td>
                      <td className="px-3 py-2 text-[#4B5563] border-r border-[#5E35B1]/20 align-middle font-normal">
                        {vocab.synonyms.length > 0
                          ? vocab.synonyms.map((s) => (
                              <div
                                key={`syn-${vocab.word}-${s.word}-${s.meaning}`}
                                className="mb-1 last:mb-0"
                              >
                                {s.word} {s.meaning}
                              </div>
                            ))
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
                        {vocab.antonyms.length > 0
                          ? vocab.antonyms.map((a) => (
                              <div
                                key={`ant-${vocab.word}-${a.word}-${a.meaning}`}
                                className="mb-1 last:mb-0"
                              >
                                {a.word} {a.meaning}
                              </div>
                            ))
                          : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}
