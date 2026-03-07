import { auth } from "@/auth";
import PricingFaq from "@/components/pricing/PricingFaq";
import PricingGrid from "@/components/pricing/PricingGrid";
import type { PlanId } from "@gyoanmaker/shared/plans";
import { getSubscription } from "@/lib/subscription";

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
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-500">
          Choose the plan that fits your academy.
          <br className="hidden sm:block" />
          All plans include PDF export and AI-powered handout generation.
        </p>
      </section>

      <PricingGrid currentPlan={currentPlan} />
      <PricingFaq />
    </main>
  );
}
