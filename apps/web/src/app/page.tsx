import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import SampleCarousel from "@/components/landing/SampleCarousel";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="w-full">
      <HeroSection />
      <SampleCarousel />
    </div>
  );
}
