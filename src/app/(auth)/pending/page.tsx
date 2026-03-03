"use client";

import { signOut, useSession } from "next-auth/react";

export default function PendingPage() {
  const { data: session, update } = useSession();

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef9f0] via-[#f8f9fc] to-[#fff7ed] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-premium border border-gray-200/60 p-8 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50">
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>대기 아이콘</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              승인 대기 중
            </h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              로그인이 완료되었습니다.
              <br />
              관리자의 승인 후 서비스를 이용하실 수 있습니다.
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

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              승인 요청 방법
            </p>
            <p className="text-xs text-blue-600 leading-relaxed">
              관리자에게 로그인에 사용한 이메일 주소를 전달해 주세요. 승인이
              완료되면 자동으로 서비스에 접근할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const res = await update();
              // @ts-expect-error - approved property exists in our custom session
              if (res?.user?.approved) {
                window.location.href = "/";
              } else {
                alert("아직 승인 대기 중입니다. 잠시 후 다시 시도해 주세요.");
              }
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            이미 승인되었나요? 상태 확인하기
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 text-xs font-medium hover:bg-gray-50 transition-all"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
