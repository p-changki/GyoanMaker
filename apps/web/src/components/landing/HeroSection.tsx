"use client";

import { motion } from "framer-motion";
import LandingCta from "./LandingCta";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative bg-white pb-8 pt-20 sm:pt-28">
      <div className="mx-auto max-w-[900px] px-4 text-center">
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-5xl font-extrabold italic leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
        >
          AI가 만드는
          <br />
          영어 교안.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.25}
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg"
        >
          영어 지문을 입력하면 문장 분석, 어휘, 요약을 자동 생성합니다.
          <br className="hidden sm:block" />
          맞춤 교안을 PDF로 내보내고 단어 테스트까지 한번에.
        </motion.p>

        {/* Dual CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <LandingCta />
          <a
            href="/about"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-8 py-4 text-base font-bold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 sm:text-lg"
          >
            기능 둘러보기
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.55}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <p className="text-xs italic text-gray-400">
            * 무료로 시작, 결제 없이 체험 가능
          </p>
        </motion.div>
      </div>
    </section>
  );
}
