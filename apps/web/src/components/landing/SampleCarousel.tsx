"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const SAMPLES = [
  {
    label: "Sentence Analysis",
    category: "SENTENCE ANALYSIS",
    image: "/images/samples/sample-1.png",
  },
  {
    label: "Core Vocabulary",
    category: "CORE VOCABULARY",
    image: "/images/samples/sample-2.png",
  },
  {
    label: "Lecture Handout (1)",
    category: "LECTURE HANDOUT",
    image: "/images/samples/sample-3.png",
  },
  {
    label: "Lecture Handout (2)",
    category: "LECTURE HANDOUT",
    image: "/images/samples/sample-4.png",
  },
  {
    label: "Generate Handout",
    category: "GENERATE",
    image: "/images/samples/sample-5.png",
  },
];

const ITEMS = [...SAMPLES, ...SAMPLES];

export default function SampleCarousel() {
  return (
    <section className="overflow-hidden bg-white pb-20 pt-8">
      <div className="relative">
        {/* Fade overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent sm:w-36" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent sm:w-36" />

        <motion.div
          className="flex gap-5 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 35,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {ITEMS.map((item, i) => (
            <motion.div
              key={`${item.label}-${i}`}
              whileHover={{ scale: 1.03, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0"
            >
              <div className="relative h-[360px] w-[290px] overflow-hidden rounded-3xl shadow-xl sm:h-[440px] sm:w-[350px]">
                {/* Image */}
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  className="object-cover"
                  sizes="350px"
                />

                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 pb-6 pt-20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                    {item.category}
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {item.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
