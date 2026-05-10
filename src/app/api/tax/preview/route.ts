import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcBusinessIncome, calcDailyLabor } from "@/lib/tax";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const yearMonth = url.searchParams.get("yearMonth");
  const type = url.searchParams.get("type") || "DAILY_LABOR";
  if (!yearMonth) return NextResponse.json({ error: "yearMonth required" }, { status: 400 });
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  // 반장별 집계: WorkUnit 기반 지급액 + DailyLog 기반 근무일수
  const units = await prisma.workUnit.findMany({
    where: { date: { gte: start, lt: end } },
    include: { foreman: { select: { id: true, name: true, rrnLast7: true } } },
  });
  const dailyLogs = await prisma.dailyLog.findMany({
    where: { date: { gte: start, lt: end } },
  });

  // foremanId 별 합계
  const aggMap = new Map<string, { foremanId: string; foremanName: string; rrnLast7: string | null; grossPay: number; workDays: Set<string> }>();
  for (const u of units) {
    const id = u.foremanId;
    const cur = aggMap.get(id) ?? {
      foremanId: id,
      foremanName: u.foreman.name,
      rrnLast7: u.foreman.rrnLast7 ?? null,
      grossPay: 0,
      workDays: new Set<string>(),
    };
    cur.grossPay += u.totalCost;
    aggMap.set(id, cur);
  }
  // 근무일수: 같은 이름의 반장이 dailyLog에 등장한 일자 수
  for (const d of dailyLogs) {
    const dateKey = d.date.toISOString().slice(0, 10);
    for (const v of aggMap.values()) {
      if (v.foremanName === d.foremanName) v.workDays.add(dateKey);
    }
  }

  const items = Array.from(aggMap.values()).map((v) => {
    const calc =
      type === "BUSINESS_INCOME"
        ? calcBusinessIncome(v.grossPay)
        : calcDailyLabor({ grossPay: v.grossPay, workDays: v.workDays.size });
    return {
      foremanId: v.foremanId,
      foremanName: v.foremanName,
      rrnLast7: v.rrnLast7,
      workDays: v.workDays.size,
      grossPay: calc.grossPay,
      incomeTax: calc.incomeTax,
      localTax: calc.localTax,
      pension: calc.pension,
      health: calc.health,
      employment: calc.employment,
      industrial: calc.industrial,
      netPay: calc.netPay,
      edited: false,
    };
  });

  return NextResponse.json(items);
}
