import type { Metadata } from "next";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "기능 소개 | 교안메이커 - AI 영어 교안 자동 생성",
  description:
    "교안메이커의 핵심 기능을 소개합니다. AI가 영어 지문을 분석해 문장 해석, 주제문, 요약, 어휘, 워크북, 강의 슬라이드까지 자동으로 생성합니다. 학원·과외·영어 교사를 위한 스마트 교안 제작 도구.",
  keywords: [
    "교안메이커 기능",
    "AI 영어 교안",
    "영어 지문 분석",
    "자동 교안 생성",
    "영어 어휘 정리",
    "영어 워크북",
    "학원 교안 제작",
    "과외 교재 만들기",
    "영어 교사 도구",
    "AI 학습자료",
    "영어 수업 자료",
    "교안 자동화",
    "강의 슬라이드",
    "PPT 자동 생성",
  ],
  openGraph: {
    title: "교안메이커 기능 소개 | AI 영어 교안 자동 생성",
    description:
      "AI가 영어 지문을 분석해 문장 해석, 주제문, 요약, 어휘, 워크북, 강의 슬라이드까지 자동 생성. 학원·과외·영어 교사를 위한 교안 제작 도구.",
    url: "https://gyoan-maker.store/about",
  },
};

export default function AboutPage() {
  return (
    <div className="w-full">
      <FeaturesSection />
      <HowItWorksSection />
    </div>
  );
}
