"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "문장 분석",
    description:
      "문장별 영한 번역과 주제문 자동 식별을 제공합니다.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: { bg: "bg-blue-50", text: "text-blue-600" },
  },
  {
    title: "핵심 어휘",
    description:
      "B2~C1 수준의 핵심 어휘를 뜻, 유의어, 반의어와 함께 추출합니다.",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    color: { bg: "bg-indigo-50", text: "text-indigo-600" },
  },
  {
    title: "스마트 요약",
    description:
      "AI가 영어·한국어 요약과 논리 흐름 분석을 자동 생성합니다.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: { bg: "bg-violet-50", text: "text-violet-600" },
  },
  {
    title: "난이도 설정",
    description:
      "심화 (B2~C1) 또는 기본 (A2~B1)을 선택해 학생 수준에 맞출 수 있습니다.",
    icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    color: { bg: "bg-amber-50", text: "text-amber-600" },
  },
  {
    title: "템플릿 스튜디오",
    description:
      "글꼴, 색상, 레이아웃, 브랜딩을 커스터마이징하여 학원만의 스타일을 적용하세요.",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    color: { bg: "bg-rose-50", text: "text-rose-600" },
  },
  {
    title: "AI 일러스트",
    description:
      "프리셋 컨셉이나 커스텀 스타일로 교안에 맞는 일러스트를 AI로 생성합니다.",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    color: { bg: "bg-pink-50", text: "text-pink-600" },
  },
  {
    title: "PDF 내보내기",
    description:
      "인쇄용 PDF로 교안을 내보냅니다. 다운로드 전 인라인 편집으로 최종 조정이 가능합니다.",
    icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: { bg: "bg-emerald-50", text: "text-emerald-600" },
  },
  {
    title: "듀얼 AI 모델",
    description:
      "정밀 모드와 속도 모드 중 선택 가능합니다. 모델별 사용량이 별도로 관리됩니다.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: { bg: "bg-cyan-50", text: "text-cyan-600" },
  },
  {
    title: "단어 테스트",
    description:
      "교안의 핵심 어휘로 유의어 5지선다 시험지를 자동 생성하고 PDF로 인쇄합니다.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    color: { bg: "bg-teal-50", text: "text-teal-600" },
  },
  {
    title: "교안 저장소",
    description:
      "교안을 저장하고 언제든 다시 열 수 있습니다. 중복 감지로 불필요한 작업을 방지합니다.",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    color: { bg: "bg-gray-100", text: "text-gray-600" },
  },
] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const card = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            주요 기능
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            전문적인 영어 교안 제작에 필요한 모든 것
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={card}
              whileHover={{ y: -5 }}
              className="space-y-3 rounded-3xl border border-gray-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.color.bg}`}
              >
                <svg
                  className={`h-5 w-5 ${f.color.text}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>{f.title}</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={f.icon}
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
