"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Sample {
  label: string;
  category: string;
  image: string;
  color: string;
}

const SAMPLES: Sample[] = [
  {
    label: "문장 분석",
    category: "분석",
    image: "/images/samples/sample-1.png",
    color: "from-violet-500/20 to-indigo-500/20",
  },
  {
    label: "핵심 어휘",
    category: "어휘",
    image: "/images/samples/sample-2.png",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    label: "수업 교안 (1)",
    category: "교안",
    image: "/images/samples/sample-3.png",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    label: "수업 교안 (2)",
    category: "교안",
    image: "/images/samples/sample-4.png",
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    label: "생성 페이지",
    category: "생성",
    image: "/images/samples/sample-5.png",
    color: "from-rose-500/20 to-pink-500/20",
  },
  {
    label: "삽화 교안 (1)",
    category: "교안",
    image: "/images/samples/sample-6.png",
    color: "from-purple-500/20 to-violet-500/20",
  },
  {
    label: "삽화 교안 (2)",
    category: "교안",
    image: "/images/samples/sample-7.png",
    color: "from-sky-500/20 to-blue-500/20",
  },
  {
    label: "스타일 갤러리",
    category: "삽화",
    image: "/images/samples/sample-8.png",
    color: "from-fuchsia-500/20 to-pink-500/20",
  },
];

const ITEMS = [...SAMPLES, ...SAMPLES];

function CarouselCard({
  item,
  index,
  onSelect,
}: {
  item: Sample;
  index: number;
  onSelect: (item: Sample, id: string) => void;
}) {
  const layoutId = `sample-card-${item.label}-${index}`;

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex-shrink-0"
    >
      <motion.div
        layoutId={layoutId}
        onClick={() => onSelect(item, layoutId)}
        className="group relative flex h-[480px] w-[360px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-lg transition-shadow hover:shadow-2xl sm:h-[580px] sm:w-[440px]"
      >
        {/* Browser-style top bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="ml-2 flex-1 rounded-md bg-white px-3 py-1 text-[11px] text-gray-400">
            gyoan-maker.store
          </div>
        </div>

        {/* Image area */}
        <div className={`relative flex-1 bg-gradient-to-br ${item.color}`}>
          <Image
            src={item.image}
            alt={item.label}
            fill
            className="object-contain p-3"
            sizes="(min-width: 640px) 440px, 360px"
            priority={index === 0}
          />
        </div>

        {/* Bottom label */}
        <div className="border-t border-gray-100 bg-white px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
            {item.category}
          </p>
          <p className="mt-0.5 text-base font-bold text-gray-900">
            {item.label}
          </p>
        </div>

        {/* Click hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            클릭하여 확대
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExpandedOverlay({
  item,
  layoutId,
  onClose,
}: {
  item: Sample;
  layoutId: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      />

      {/* Expanded card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-8">
        <motion.div
          layoutId={layoutId}
          className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-2xl"
        >
          {/* Browser-style top bar */}
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-5 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="ml-3 flex-1 rounded-md bg-white px-4 py-1.5 text-xs text-gray-400">
              gyoan-maker.store
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Full image area */}
          <div
            className={`relative flex-1 overflow-auto bg-gradient-to-br ${item.color}`}
            style={{ minHeight: "60vh" }}
          >
            <Image
              src={item.image}
              alt={item.label}
              fill
              className="object-contain p-4 sm:p-6"
              sizes="(min-width: 768px) 900px, 100vw"
              priority
            />
          </div>

          {/* Bottom label */}
          <div className="border-t border-gray-100 bg-white px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
              {item.category}
            </p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {item.label}
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function SampleCarousel() {
  const [selected, setSelected] = useState<{
    item: Sample;
    layoutId: string;
  } | null>(null);

  const handleSelect = useCallback((item: Sample, layoutId: string) => {
    setSelected({ item, layoutId });
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <section className="overflow-hidden bg-gradient-to-b from-white to-gray-50/80 pb-24 pt-16">
      {/* Section header */}
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-bold uppercase tracking-widest text-blue-600"
        >
          샘플 결과물
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl"
        >
          이런 교안을 만들 수 있습니다
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-base text-gray-500 sm:text-lg"
        >
          지문 분석부터 인쇄용 교안까지, 모두 자동으로
          생성됩니다.
        </motion.p>
      </div>

      {/* Carousel */}
      <div className="relative mt-14">
        {/* Fade overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-48" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-gray-50/80 to-transparent sm:w-48" />

        <motion.div
          className="flex gap-6 px-4 sm:gap-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {ITEMS.map((item, i) => (
            <CarouselCard
              key={`${item.label}-${i}`}
              item={item}
              index={i}
              onSelect={handleSelect}
            />
          ))}
        </motion.div>
      </div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {selected && (
          <ExpandedOverlay
            item={selected.item}
            layoutId={selected.layoutId}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
