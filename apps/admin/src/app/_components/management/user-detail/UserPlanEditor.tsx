"use client";

interface SubscriptionInfo {
  tier: "free" | "basic" | "standard" | "pro";
  status: "active" | "expired";
}

interface UserPlanEditorProps {
  editPlan: "free" | "basic" | "standard" | "pro";
  subscription: SubscriptionInfo | null;
  saving: boolean;
  onChangePlan: (plan: "free" | "basic" | "standard" | "pro") => void;
  onSave: () => void;
}

export default function UserPlanEditor({
  editPlan,
  subscription,
  saving,
  onChangePlan,
  onSave,
}: UserPlanEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            구독 요금제
          </label>
          <select
            value={editPlan}
            onChange={(e) =>
              onChangePlan(e.target.value as "free" | "basic" | "standard" | "pro")
            }
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            <option value="free">FREE</option>
            <option value="basic">BASIC</option>
            <option value="standard">STANDARD</option>
            <option value="pro">PRO</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-violet-500 text-white text-xs font-bold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 shrink-0"
        >
          요금제 저장
        </button>
      </div>
      {subscription && (
        <p className="text-xs text-gray-500">
          현재 요금제:{" "}
          <strong>{subscription.tier.toUpperCase()}</strong> (
          {subscription.status === "active" ? "활성" : "만료"})
        </p>
      )}
    </div>
  );
}
