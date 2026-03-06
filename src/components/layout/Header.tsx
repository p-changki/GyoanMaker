import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Header() {
  return (
    <header className="relative z-60 border-b border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-[1100px] px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">교안 생성기</h1>
            <p className="mt-1 text-sm text-gray-500">
              AI 기반 맞춤형 교육 자료 제작 도구
            </p>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/generate"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              생성
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              내 교안
            </Link>
            <Link
              href="/account"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              내 계정
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              요금제
            </Link>
          </nav>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
