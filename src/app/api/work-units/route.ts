import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  date: z.string(),
  projectId: z.string(),
  workTypeId: z.string(),
  units: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
  foremanId: z.string().optional(), // admin 사용시
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const yearMonth = url.searchParams.get("yearMonth");
  const projectId = url.searchParams.get("projectId");
  const date = url.searchParams.get("date");
  const mine = url.searchParams.get("mine") === "true";
  const foremanId = url.searchParams.get("foremanId");

  const where: any = {};
  if (yearMonth) {
    const [y, m] = yearMonth.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  }
  if (projectId) where.projectId = projectId;
  if (mine) where.foremanId = session.user.id;
  if (foremanId) where.foremanId = foremanId;
  if (session.user.role === "FOREMAN" && !mine) where.foremanId = session.user.id;

  const items = await prisma.workUnit.findMany({
    where,
    include: {
      project: { select: { name: true } },
      workType: { select: { name: true } },
      foreman: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items.map((u) => ({ ...u, date: u.date.toISOString(), createdAt: u.createdAt.toISOString() })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = session.user.role;
  const isTeamLead = (session.user as any).isTeamLead;
  if (role === "FOREMAN" && !isTeamLead) {
    return NextResponse.json({ error: "팀장 반장만 입력 가능합니다." }, { status: 403 });
  }
  if (!["FOREMAN", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const foremanId = role === "ADMIN" ? parsed.data.foremanId : session.user.id;
  if (!foremanId) return NextResponse.json({ error: "foremanId required" }, { status: 400 });

  const created = await prisma.workUnit.create({
    data: {
      date: new Date(parsed.data.date),
      projectId: parsed.data.projectId,
      workTypeId: parsed.data.workTypeId,
      units: parsed.data.units,
      unitPrice: parsed.data.unitPrice,
      totalCost: parsed.data.totalCost,
      notes: parsed.data.notes || null,
      foremanId,
      createdById: session.user.id,
    },
  });
  return NextResponse.json(created);
}
