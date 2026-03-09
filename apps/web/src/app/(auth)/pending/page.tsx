"use client";

import { signOut, useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

export default function PendingPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const userStatus = session?.user?.userStatus ?? "pending";
  const isRejected = userStatus === "rejected";

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef9f0] via-[#f8f9fc] to-[#fff7ed] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-premium border border-gray-200/60 p-8 space-y-6 text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              isRejected ? "bg-red-50" : "bg-amber-50"
            }`}
          >
            {isRejected ? (
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Restricted icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Pending icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {isRejected ? "접근 제한됨" : "승인 대기 중"}
            </h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              {isRejected ? (
                <>
                  관리자에 의해 접근이 제한되었습니다.
                  <br />
                  오류라고 생각되시면 관리자에게 문의해 주세요.
                </>
              ) : (
                <>
                  로그인이 완료되었습니다.
                  <br />
                  관리자 승인 후 서비스를 이용하실 수 있습니다.
                </>
              )}
            </p>
          </div>

          {session?.user && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
              <p className="text-sm font-semibold text-gray-800">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          )}

          <div
            className={`${
              isRejected
                ? "bg-red-50 border-red-100"
                : "bg-blue-50 border-blue-100"
            } border rounded-2xl p-4 text-left`}
          >
            <p
              className={`text-sm font-semibold mb-1 ${
                isRejected ? "text-red-800" : "text-blue-800"
              }`}
            >
              {isRejected ? "접근이 제한된 이유는?" : "승인받는 방법"}
            </p>
            <p
              className={`text-xs leading-relaxed ${
                isRejected ? "text-red-600" : "text-blue-600"
              }`}
            >
              {isRejected
                ? "정책 위반으로 계정이 제한되었을 수 있습니다. 자세한 내용은 관리자에게 문의해 주세요."
                : "로그인에 사용한 이메일을 관리자에게 공유해 주세요. 승인되면 자동으로 서비스를 이용할 수 있습니다."}
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const res = await update();
              if (res?.user?.approved) {
                window.location.href = "/generate";
              } else {
                toast(
                  isRejected
                    ? "접근이 여전히 제한되어 있습니다. 관리자에게 문의해 주세요."
                    : "아직 승인 대기 중입니다. 나중에 다시 확인해 주세요.",
                  "info"
                );
              }
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            상태 확인
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 text-xs font-medium hover:bg-gray-50 transition-all"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
