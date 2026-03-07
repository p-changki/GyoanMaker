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
              <title>Pending icon</title>
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
              Pending Approval
            </h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              Sign-in is complete.
              <br />
              You can use the service after admin approval.
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
              How to Get Approved
            </p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Please share the email address you used to sign in with the
              administrator. Once approved, you will automatically gain access
              to the service.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const res = await update();
              if (res?.user?.approved) {
                window.location.href = "/generate";
              } else {
                alert("Still pending approval. Please try again later.");
              }
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Already approved? Check status
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 text-xs font-medium hover:bg-gray-50 transition-all"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
