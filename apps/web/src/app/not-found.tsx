import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef9f0] via-[#f8f9fc] to-[#fff7ed] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-premium border border-gray-200/60 p-8 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
            <span className="text-3xl font-extrabold text-gray-400">404</span>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Page Not Found
            </h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              The page you are looking for does not exist
              <br />
              or may have been moved.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold text-center hover:bg-gray-800 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/generate"
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold text-center hover:bg-gray-50 transition-colors"
            >
              Generate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
