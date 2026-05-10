import TopNav from "@/components/TopNav";
import { requireRole } from "@/lib/guard";

export default async function ForemanLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("FOREMAN");
  const isTeamLead = (session.user as any).isTeamLead;
  const items = [
    { href: "/foreman", label: "대시보드" },
    { href: "/foreman/attendance", label: "출퇴근" },
    ...(isTeamLead ? [{ href: "/foreman/work-units", label: "품수/비용 입력" }] : []),
  ];
  return (
    <div className="min-h-screen">
      <TopNav items={items} />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
