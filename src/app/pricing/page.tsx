import { auth } from "@/auth";
import PricingFaq from "@/components/pricing/PricingFaq";
import PricingGrid from "@/components/pricing/PricingGrid";
import type { PlanId } from "@/lib/plans";
import { getSubscription } from "@/lib/subscription";

export default async function PricingPage() {
  const session = await auth();
  let currentPlan: PlanId | undefined;

  if (session?.user?.email) {
    const subscription = await getSubscription(session.user.email).catch(() => null);
    currentPlan = subscription?.tier;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 space-y-8">
      <section className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          요금제
        </h1>
        <p className="text-gray-500">
          교안 생성량과 저장 한도에 맞춰 Free부터 Pro까지 선택할 수 있습니다.
        </p>
      </section>

      <PricingGrid currentPlan={currentPlan} />
      <PricingFaq />
    </main>
  );
}
