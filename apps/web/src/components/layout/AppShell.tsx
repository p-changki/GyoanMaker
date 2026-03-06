import HeaderServer from "./HeaderServer";
import Footer from "./Footer";
import AppShellContent from "./AppShellContent";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShellContent header={<HeaderServer />} footer={<Footer />}>
      {children}
    </AppShellContent>
  );
}
