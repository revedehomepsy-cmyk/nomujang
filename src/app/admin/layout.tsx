import TopNav from "@/components/TopNav";
import { requireRole } from "@/lib/guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <div className="min-h-screen">
      <TopNav
        items={[
          { href: "/admin", label: "대시보드" },
          { href: "/admin/cross-check", label: "품수 크로스체크" },
          { href: "/admin/tax", label: "세금/보험 계산" },
          { href: "/admin/tax-report", label: "세무사 메일 발송" },
        ]}
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
