import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import LazySampleCarousel from "@/components/landing/LazySampleCarousel";
import EarlyOpenModal from "@/components/landing/EarlyOpenModal";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "교안메이커 | AI 영어 교안 자동 생성기",
  description:
    "영어 지문을 입력하면 AI가 문장 분석, 핵심 어휘, 요약을 자동 생성합니다. 워크북, 단어 테스트, 포켓보카, 강의 슬라이드까지 학원·과외용 PDF 교안을 원클릭으로 제작하세요.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="w-full">
      <EarlyOpenModal />
      <HeroSection />
      <LazySampleCarousel />
    </div>
  );
}
