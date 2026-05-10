import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const yearMonth = url.searchParams.get("yearMonth");
  const projectId = url.searchParams.get("projectId");

  const where: any = {};
  if (yearMonth) {
    const [y, m] = yearMonth.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }
  if (projectId) where.projectId = projectId;

  const [dailyLogs, workUnits] = await Promise.all([
    prisma.dailyLog.findMany({
      where,
      include: {
        project: { select: { name: true } },
        workType: { select: { name: true } },
      },
    }),
    prisma.workUnit.findMany({
      where,
      include: {
        project: { select: { name: true } },
        workType: { select: { name: true } },
        foreman: { select: { name: true } },
      },
    }),
  ]);

  // key: date|projectId|workTypeId|foremanName
  const map = new Map<string, any>();
  for (const d of dailyLogs) {
    const dateKey = d.date.toISOString().slice(0, 10);
    const key = `${dateKey}|${d.projectId}|${d.workTypeId}|${d.foremanName}`;
    const cur = map.get(key) ?? {
      date: d.date.toISOString(),
      project: d.project.name,
      workType: d.workType.name,
      foremanName: d.foremanName,
      workerCount: 0,
      units: 0,
      totalCost: 0,
    };
    cur.workerCount += d.workerCount;
    map.set(key, cur);
  }
  for (const u of workUnits) {
    const dateKey = u.date.toISOString().slice(0, 10);
    const key = `${dateKey}|${u.projectId}|${u.workTypeId}|${u.foreman.name}`;
    const cur = map.get(key) ?? {
      date: u.date.toISOString(),
      project: u.project.name,
      workType: u.workType.name,
      foremanName: u.foreman.name,
      workerCount: 0,
      units: 0,
      totalCost: 0,
    };
    cur.units += u.units;
    cur.totalCost += u.totalCost;
    map.set(key, cur);
  }

  const rows = Array.from(map.values())
    .map((r) => ({
      ...r,
      diff: r.workerCount - r.units,
      match: r.workerCount === r.units,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return NextResponse.json(rows);
}
