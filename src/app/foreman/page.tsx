import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ForemanHome() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isTeamLead = (session?.user as any)?.isTeamLead;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todays = userId
    ? await prisma.attendance.findMany({
        where: { userId, capturedAt: { gte: today, lt: tomorrow } },
        orderBy: { capturedAt: "asc" },
        include: { project: { select: { name: true } } },
      })
    : [];

  const checkedIn = todays.find((a) => a.type === "CHECK_IN");
  const checkedOut = todays.find((a) => a.type === "CHECK_OUT");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">반장 대시보드</h1>
      <div className="card">
        <div className="text-sm text-slate-500">오늘 출퇴근</div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="text-center">
            <div className="text-xs text-slate-500">출근</div>
            <div className="text-lg font-bold mt-1">
              {checkedIn
                ? new Date(checkedIn.capturedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                : "미기록"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500">퇴근</div>
            <div className="text-lg font-bold mt-1">
              {checkedOut
                ? new Date(checkedOut.capturedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                : "미기록"}
            </div>
          </div>
        </div>
        {checkedIn && (
          <div className="text-xs text-slate-500 mt-2">현장: {checkedIn.project.name}</div>
        )}
      </div>

      <Link href="/foreman/attendance" className="btn-primary block text-center">
        {checkedIn ? "퇴근 사진 찍기" : "출근 사진 찍기"}
      </Link>

      {isTeamLead && (
        <Link href="/foreman/work-units" className="btn-secondary block text-center">
          품수/비용 입력
        </Link>
      )}
    </div>
  );
}
