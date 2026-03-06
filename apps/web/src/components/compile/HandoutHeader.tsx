"use client";

import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { EditableHeaderText } from "./EditableFields";

export function HandoutHeader({ section }: { section: HandoutSection }) {
  return (
    <header className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 bg-[#FFE4E1] shrink-0">
      <div className="flex items-end justify-between pb-4 pt-6 gap-4">
        <div className="flex flex-col relative flex-1 h-[56px]">
          <div className="absolute -top-[45px] left-0 bg-[#D1D5DB] rounded-b-[1.25rem] w-[64px] h-[60px] rounded-tr-none z-0 translate-x-2 translate-y-2" />
          <div
            className="absolute -top-[45px] left-0 bg-[#5E35B1] rounded-b-[1.25rem] rounded-tr-none w-[64px] h-[60px] flex items-center justify-center z-10"
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            }}
          >
            <span className="text-white text-[36px] font-black tracking-tighter leading-none mt-1">
              {section.passageId.slice(1).padStart(2, "0")}
            </span>
          </div>

          <h1
            className="absolute bottom-0 left-0 text-[#5E35B1] tracking-tighter leading-none"
            style={{ fontFamily: "GmarketSans, sans-serif" }}
          >
            <span className="text-[36px] font-bold">L</span>
            <span className="text-[36px] font-medium">ogic</span>
          </h1>
        </div>
        <div className="bg-[#5E35B1] px-4 py-1.5 text-white text-[13px] font-bold shrink-0 whitespace-nowrap translate-y-4 relative z-20">
          <EditableHeaderText />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#5E35B1]" />
    </header>
  );
}

export function HandoutFooter({
  section,
  pageNum,
}: {
  section: HandoutSection;
  pageNum: number;
}) {
  return (
    <footer className="mt-auto pt-10 flex items-center justify-end shrink-0">
      <span className="text-xs font-black text-[#E5E7EB]">
        PAGE {section.passageId.slice(1)}-{pageNum}
      </span>
    </footer>
  );
}
