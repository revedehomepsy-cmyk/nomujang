import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  projectId: z.string(),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  photoData: z.string().min(50),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const projectId = url.searchParams.get("projectId");
  const userId = url.searchParams.get("userId");

  const where: any = {};
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.capturedAt = { gte: d, lt: next };
  }
  if (projectId) where.projectId = projectId;
  if (userId) where.userId = userId;
  // 반장은 자기 것만
  if (session.user.role === "FOREMAN") where.userId = session.user.id;

  const items = await prisma.attendance.findMany({
    where,
    include: { user: { select: { name: true, email: true } }, project: { select: { name: true } } },
    orderBy: { capturedAt: "desc" },
  });
  return NextResponse.json(
    items.map((a) => ({ ...a, capturedAt: a.capturedAt.toISOString() }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const att = await prisma.attendance.create({
    data: {
      userId: session.user.id,
      projectId: parsed.data.projectId,
      type: parsed.data.type,
      photoData: parsed.data.photoData,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
  });
  return NextResponse.json({ id: att.id });
}
