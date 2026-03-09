"use client";

import { useVocaTestStore } from "../_hooks/useVocaTestStore";

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#5E35B1] focus:ring-2 focus:ring-[#5E35B1]/10"
      />
    </label>
  );
}

export default function TestConfigPanel() {
  const config = useVocaTestStore((state) => state.config);
  const updateConfig = useVocaTestStore((state) => state.updateConfig);

  return (
    <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 2.5</p>
        <h3 className="text-lg font-bold text-gray-900">시험지 설정</h3>
      </header>

      <div className="space-y-3">
        <Field
          label="테스트 코드"
          value={config.testCode}
          placeholder="VT1"
          onChange={(value) => updateConfig({ testCode: value })}
        />
        <Field
          label="범위 설명"
          value={config.rangeDescription}
          placeholder="예: 26년 3월 20-30번 유의어"
          onChange={(value) => updateConfig({ rangeDescription: value })}
        />
        <Field
          label="학교/학원명"
          value={config.schoolName}
          placeholder="예: OO고등학교"
          onChange={(value) => updateConfig({ schoolName: value })}
        />
        <Field
          label="교사명"
          value={config.teacherName}
          placeholder="예: 홍길동 영어"
          onChange={(value) => updateConfig({ teacherName: value })}
        />
        <Field
          label="커트라인"
          value={config.cutline}
          placeholder="-3"
          onChange={(value) => updateConfig({ cutline: value })}
        />
      </div>
    </aside>
  );
}
