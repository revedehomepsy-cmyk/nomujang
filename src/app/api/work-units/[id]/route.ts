import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const item = await prisma.workUnit.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (session.user.role === "FOREMAN" && item.foremanId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.workUnit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
