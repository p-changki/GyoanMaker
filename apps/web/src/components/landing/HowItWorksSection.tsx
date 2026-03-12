"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: 1,
    title: "지문 입력",
    description:
      "영어 지문을 텍스트 블록으로 붙여넣거나 카드별로 개별 추가하세요.",
    color: { bg: "bg-blue-100", text: "text-blue-700" },
  },
  {
    number: 2,
    title: "옵션 선택 & 생성",
    description:
      "난이도(심화/기본)와 생성 모드(정밀/속도)를 선택하고 생성 버튼을 누르세요.",
    color: { bg: "bg-indigo-100", text: "text-indigo-700" },
  },
  {
    number: 3,
    title: "일러스트 추가",
    description:
      "프리셋 컨셉이나 커스텀 스타일로 AI 일러스트를 적용하세요.",
    color: { bg: "bg-pink-100", text: "text-pink-700" },
  },
  {
    number: 4,
    title: "커스터마이징 & 내보내기",
    description:
      "템플릿 스튜디오로 세부 조정 후 인쇄용 PDF로 다운로드하세요.",
    color: { bg: "bg-emerald-100", text: "text-emerald-700" },
  },
  {
    number: 5,
    title: "보카테스트 & 강의 슬라이드",
    description:
      "단어 테스트·포켓보카로 어휘를 복습하고, 강의 슬라이드(PPT)로 수업 자료를 완성하세요.",
    color: { bg: "bg-teal-100", text: "text-teal-700" },
  },
] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const badge = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function HowItWorksSection() {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            이용 방법
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            5단계로 완성하는 영어 수업 자료
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-5"
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={item}
              className="space-y-4 text-center"
            >
              <motion.div
                variants={badge}
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold ${step.color.bg} ${step.color.text}`}
              >
                {step.number}
              </motion.div>
              <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
