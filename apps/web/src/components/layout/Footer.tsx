import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-[1100px] px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} GyoanMaker</p>
        <nav className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-gray-700 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
