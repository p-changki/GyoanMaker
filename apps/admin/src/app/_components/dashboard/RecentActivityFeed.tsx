"use client";

interface AppUser {
  email: string;
  name: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  deleted: "bg-gray-100 text-gray-500 border-gray-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "거부",
  deleted: "탈퇴",
};

interface RecentActivityFeedProps {
  users: AppUser[];
}

export default function RecentActivityFeed({ users }: RecentActivityFeedProps) {
  const recent = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">최근 가입 유저 없음</p>
    );
  }

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl divide-y divide-gray-100 overflow-hidden">
      {recent.map((user) => (
        <div key={user.email} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name ?? "이름 없음"}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${STATUS_BADGE[user.status] ?? ""}`}>
              {STATUS_LABEL[user.status] ?? user.status}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(user.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
