"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: 1,
    title: "Input Passages",
    description:
      "Paste English passages as a text block or add them individually as cards.",
    color: { bg: "bg-blue-100", text: "text-blue-700" },
  },
  {
    number: 2,
    title: "Choose Options & Generate",
    description:
      "Select difficulty level (Advanced/Basic) and generation mode (Precision/Speed). Hit generate and let AI do the work.",
    color: { bg: "bg-indigo-100", text: "text-indigo-700" },
  },
  {
    number: 3,
    title: "Customize & Export",
    description:
      "Fine-tune with the Template Studio, edit inline, then download as a print-ready PDF.",
    color: { bg: "bg-emerald-100", text: "text-emerald-700" },
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
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Create a complete handout in 3 simple steps
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
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
