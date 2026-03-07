"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Sentence Analysis",
    description:
      "Automatic sentence-by-sentence EN/KO translation with topic sentence identification.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: { bg: "bg-blue-50", text: "text-blue-600" },
  },
  {
    title: "Core Vocabulary",
    description:
      "Extract key vocabulary with meanings, synonyms, and antonyms at B2~C1 level.",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    color: { bg: "bg-indigo-50", text: "text-indigo-600" },
  },
  {
    title: "Smart Summary",
    description:
      "AI-generated passage summaries in both English and Korean, with logical flow analysis.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: { bg: "bg-violet-50", text: "text-violet-600" },
  },
  {
    title: "Level Customization",
    description:
      "Choose Advanced (B2~C1) or Basic (A2~B1) to match student proficiency levels.",
    icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    color: { bg: "bg-amber-50", text: "text-amber-600" },
  },
  {
    title: "Template Studio",
    description:
      "Customize fonts, colors, layouts, and branding. Apply your academy's style to every handout.",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    color: { bg: "bg-rose-50", text: "text-rose-600" },
  },
  {
    title: "PDF Export",
    description:
      "Export print-ready handouts as PDF. Inline editing before download for final adjustments.",
    icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: { bg: "bg-emerald-50", text: "text-emerald-600" },
  },
  {
    title: "Dual AI Models",
    description:
      "Choose between precision mode and speed mode depending on your needs. Separate quotas per model.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: { bg: "bg-cyan-50", text: "text-cyan-600" },
  },
  {
    title: "Dashboard",
    description:
      "Save, manage, and revisit your handouts anytime. Duplicate detection prevents redundant work.",
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
            Features
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need to create professional teaching handouts
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
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
