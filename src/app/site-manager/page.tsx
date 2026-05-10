import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SiteManagerHome() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [activeProjects, todayLogs, todayWorkers] = await Promise.all([
    prisma.project.count({ where: { isActive: true } }),
    prisma.dailyLog.count({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.dailyLog.aggregate({
      _sum: { workerCount: true },
      where: { date: { gte: today, lt: tomorrow } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">현장소장 대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">오늘의 작업 현황을 빠르게 확인하세요.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="진행 중인 프로젝트" value={`${activeProjects}건`} />
        <Stat label="오늘 작업 입력 건수" value={`${todayLogs}건`} />
        <Stat label="오늘 총 작업자" value={`${todayWorkers._sum.workerCount ?? 0}명`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/site-manager/daily" className="card hover:shadow transition">
          <div className="text-sm text-slate-500">오늘의 작업 입력</div>
          <div className="text-xl font-semibold mt-1">반장님과 작업자 수 입력</div>
        </Link>
        <Link href="/site-manager/attendance" className="card hover:shadow transition">
          <div className="text-sm text-slate-500">출퇴근 기록 확인</div>
          <div className="text-xl font-semibold mt-1">반장님 얼굴 출퇴근 사진</div>
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
