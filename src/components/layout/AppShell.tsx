import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Header />
      <main className="mx-auto max-w-[1100px] px-4 py-8">
        {children}
      </main>
    </div>
  );
}
