import type { Metadata } from "next";
import { auth } from "@/auth";
import PricingFaq from "@/components/pricing/PricingFaq";
import PricingGrid from "@/components/pricing/PricingGrid";
import type { PlanId } from "@gyoanmaker/shared/plans";
import { getSubscription } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "요금제 안내",
  description:
    "교안메이커 요금제를 비교하고 학원 규모에 맞는 플랜을 선택하세요. 무료 체험부터 프로 플랜까지, AI 교안 생성과 PDF 출력을 지원합니다.",
  alternates: {
    canonical: "/pricing",
  },
};

export default async function PricingPage() {
  const session = await auth();
  let currentPlan: PlanId | undefined;

  if (session?.user?.email) {
    const subscription = await getSubscription(session.user.email).catch(
      () => null
    );
    currentPlan = subscription?.tier;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 space-y-10">
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          합리적이고 투명한 요금제
        </h1>
        <p className="text-lg text-gray-500">
          학원에 맞는 플랜을 선택하세요.
          <br className="hidden sm:block" />
          모든 플랜에 PDF 내보내기와 AI 교안 생성이 포함됩니다.
        </p>
      </section>

      <PricingGrid currentPlan={currentPlan} />
      <PricingFaq />
    </main>
  );
}
