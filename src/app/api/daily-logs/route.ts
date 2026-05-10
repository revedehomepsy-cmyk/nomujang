import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  date: z.string(),
  projectId: z.string(),
  workTypeId: z.string(),
  foremanName: z.string().min(1),
  workerCount: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const projectId = url.searchParams.get("projectId");
  const yearMonth = url.searchParams.get("yearMonth"); // YYYY-MM

  const where: any = {};
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  } else if (yearMonth) {
    const [y, m] = yearMonth.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.date = { gte: start, lt: end };
  }
  if (projectId) where.projectId = projectId;

  const logs = await prisma.dailyLog.findMany({
    where,
    include: {
      project: { select: { name: true } },
      workType: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    logs.map((l) => ({
      ...l,
      date: l.date.toISOString(),
      createdAt: l.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!["SITE_MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const log = await prisma.dailyLog.create({
    data: {
      date: new Date(parsed.data.date),
      projectId: parsed.data.projectId,
      workTypeId: parsed.data.workTypeId,
      foremanName: parsed.data.foremanName,
      workerCount: parsed.data.workerCount,
      notes: parsed.data.notes || null,
      createdById: session.user.id,
    },
    include: { project: true, workType: true },
  });
  return NextResponse.json(log);
}
