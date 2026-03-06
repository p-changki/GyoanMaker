import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#f8f9fc]">
      <div className="mx-auto max-w-[1100px] px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} 교안 생성기</p>
        <nav className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-gray-700 transition-colors"
          >
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">
            이용약관
          </Link>
        </nav>
      </div>
    </footer>
  );
}
