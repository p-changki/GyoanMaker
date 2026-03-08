"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What's the difference between Speed and Precision?",
    a: "Speed generation takes 5-10 seconds per passage for quick results. Precision takes 30-60 seconds but provides higher accuracy. Usage is deducted based on the generation mode you choose, regardless of content difficulty.",
  },
  {
    q: "Does content difficulty affect my usage quota?",
    a: "No. Content difficulty (Advanced/Basic) only changes the vocabulary level — it doesn't affect your usage count. Speed mode deducts from Speed quota, Precision from Precision quota.",
  },
  {
    q: "When does my monthly quota reset?",
    a: "Quotas reset on the 1st of each month at 00:00 KST. Unused quota does not carry over to the next month.",
  },
  {
    q: "If I run out of Speed quota, can I still use Precision?",
    a: "Yes. Each generation mode has its own independent quota. Running out of one doesn't affect the other.",
  },
  {
    q: "How do credit top-ups work?",
    a: "Monthly quota is consumed first. Once depleted, purchased credits are automatically used in purchase order. Credits are valid for 90 days from purchase.",
  },
  {
    q: "What are the Free plan limitations?",
    a: "Free plan includes 10 Speed generations, 5 Precision generations, 5 illustration credits, and up to 3 saved handouts per month. Basic and above plans offer unlimited storage.",
  },
  {
    q: "What are illustration credits and how are they used?",
    a: "Illustration credits are consumed when generating AI illustrations for your handouts. Each standard-quality illustration costs 1 credit, while high-quality costs 2 credits. Credits are separate from Speed/Precision quotas.",
  },
  {
    q: "What are style tests and illustration samples?",
    a: "Style tests let you preview how an illustration concept looks before applying it to your handouts. Each plan has a daily style test limit (e.g., 3/day for Free, 10/day for Standard). Illustration samples are saved styles you can reuse — Free plan allows up to 10, Standard allows 30.",
  },
  {
    q: "Can I upgrade or downgrade my plan mid-month?",
    a: "Yes. When you upgrade, the new plan takes effect immediately and quota is adjusted. When you downgrade, the change takes effect at the start of your next billing cycle. Unused credits carry over regardless of plan changes.",
  },
  {
    q: "What happens if generation fails mid-way?",
    a: "If a generation fails due to a server error, your quota is not consumed for that attempt. You can safely retry. For illustration jobs, only successfully generated images deduct credits — failed ones do not.",
  },
  {
    q: "Can multiple passages be generated at once?",
    a: "Yes. You can input multiple passages and generate them in a single batch. Each passage counts as one generation toward your quota. For Precision mode with many passages, expect longer processing times (30-60 seconds per passage).",
  },
  {
    q: "Is there a limit on passage length?",
    a: "Yes. Each passage is limited to 400 words, and the total input per batch is capped at 5,000 words. These limits ensure consistent quality and prevent timeout errors during generation.",
  },
  {
    q: "What does 'Priority processing' mean on paid plans?",
    a: "Standard and Pro plans receive priority in the processing queue during peak hours, resulting in faster generation times. Free and Basic plans use standard queue priority.",
  },
];

const DEFAULT_VISIBLE = 3;

export default function PricingFaq() {
  const [expanded, setExpanded] = useState(false);
  const visibleFaqs = expanded ? FAQS : FAQS.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">
        Frequently Asked Questions
      </h3>
      <div className="mt-4 space-y-4">
        {visibleFaqs.map((item) => (
          <div key={item.q} className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">{item.q}</p>
            <p className="mt-1 text-sm text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
      {FAQS.length > DEFAULT_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          {expanded ? "Show less" : `Show more (${FAQS.length - DEFAULT_VISIBLE})`}
        </button>
      )}
    </div>
  );
}
