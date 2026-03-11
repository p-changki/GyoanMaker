"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const SampleCarousel = dynamic(
  () => import("@/components/landing/SampleCarousel"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[700px] bg-gradient-to-b from-white to-gray-50/80" />
    ),
  }
);

export default function LazySampleCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <SampleCarousel />
      ) : (
        <div className="h-[700px] bg-gradient-to-b from-white to-gray-50/80" />
      )}
    </div>
  );
}
