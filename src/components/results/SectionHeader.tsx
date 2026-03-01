"use client";
import { ReactNode } from "react";
import CopyButton from "@/components/CopyButton";

interface SectionHeaderProps {
  title: string;
  onCopy: () => string;
  children?: ReactNode;
}

export default function SectionHeader({ title, onCopy, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-600 rounded-full" />
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {children}
        <CopyButton
          getText={onCopy}
          label=""
          className="p-1.5 h-8 w-8 border-none bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        />
      </div>
    </div>
  );
}
