import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [users, projects, dailyLogs, workUnits] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.dailyLog.count(),
    prisma.workUnit.count(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="가입자" value={`${users}명`} />
        <Stat label="프로젝트" value={`${projects}건`} />
        <Stat label="일일 작업" value={`${dailyLogs}건`} />
        <Stat label="품수 입력" value={`${workUnits}건`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/cross-check" className="card hover:shadow">
          <div className="text-sm text-slate-500">크로스 체크</div>
          <div className="text-lg font-semibold mt-1">현장소장 vs 반장 품수 비교</div>
        </Link>
        <Link href="/admin/tax" className="card hover:shadow">
          <div className="text-sm text-slate-500">세금/보험</div>
          <div className="text-lg font-semibold mt-1">일용직 vs 사업소득 비교</div>
        </Link>
        <Link href="/admin/tax-report" className="card hover:shadow">
          <div className="text-sm text-slate-500">세무사 메일</div>
          <div className="text-lg font-semibold mt-1">월별 신고자료 발송</div>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
