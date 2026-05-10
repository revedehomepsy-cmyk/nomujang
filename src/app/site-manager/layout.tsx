import TopNav from "@/components/TopNav";
import { requireRole } from "@/lib/guard";

export default async function SiteManagerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("SITE_MANAGER");
  return (
    <div className="min-h-screen">
      <TopNav
        items={[
          { href: "/site-manager", label: "대시보드" },
          { href: "/site-manager/projects", label: "프로젝트" },
          { href: "/site-manager/daily", label: "일일 작업 입력" },
          { href: "/site-manager/attendance", label: "출퇴근 기록" },
        ]}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
