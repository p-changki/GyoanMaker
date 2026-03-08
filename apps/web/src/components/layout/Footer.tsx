import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-[1100px] px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Business info */}
          <div className="text-xs text-gray-400 space-y-0.5">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} GyoanMaker. All Rights
              Reserved.
            </p>
            <p>
              사업자등록번호: xxx-xx-xxxxx | 통신판매업 신고번호:
              xxxx-xxxx-xxxx
            </p>
            <p>대표: 박창기 | 문의: dnsxj12345aa@gmail.com</p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
            <Link
              href="/terms"
              className="hover:text-gray-700 transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gray-700 transition-colors"
            >
              개인정보 처리방침
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
