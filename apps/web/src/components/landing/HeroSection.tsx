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
          English Handouts,
          <br />
          Powered by AI.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.25}
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg"
        >
          Enter a passage to auto-generate sentence analysis, vocabulary, and summaries.
          <br className="hidden sm:block" />
          Export custom handouts by difficulty as PDF instantly.
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
            Browse Features
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
            * Free to start, no payment required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
