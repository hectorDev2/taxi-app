import Sidebar from "@/components/sidebar";
import AuthGuard from "@/components/auth-guard";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </AuthGuard>
  );
}
