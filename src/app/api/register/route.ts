import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  role: z.enum(["SITE_MANAGER", "FOREMAN", "ADMIN"]),
  isTeamLead: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  const { email, password, name, phone, role, isTeamLead } = parsed.data;
  const normalized = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      name,
      phone: phone || null,
      role,
      isTeamLead: role === "FOREMAN" ? !!isTeamLead : false,
    },
    select: { id: true, email: true, role: true },
  });
  return NextResponse.json(user);
}
