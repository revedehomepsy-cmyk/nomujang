import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function runSeed() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  const workTypes = [
    "철근", "형틀", "콘크리트", "조적", "미장", "방수",
    "타일", "도장", "전기", "설비", "토공", "잡부",
  ];
  for (const name of workTypes) {
    await prisma.workType.upsert({ where: { name }, update: {}, create: { name } });
  }

  await prisma.user.upsert({
    where: { email: "admin@nomujang.kr" },
    update: {},
    create: { email: "admin@nomujang.kr", passwordHash, name: "관리자", role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "site@nomujang.kr" },
    update: {},
    create: { email: "site@nomujang.kr", passwordHash, name: "현장소장", role: "SITE_MANAGER" },
  });
  await prisma.user.upsert({
    where: { email: "foreman@nomujang.kr" },
    update: {},
    create: { email: "foreman@nomujang.kr", passwordHash, name: "김반장", role: "FOREMAN", isTeamLead: true },
  });

  const counts = {
    users: await prisma.user.count(),
    workTypes: await prisma.workType.count(),
  };
  return counts;
}

function authorized(req: Request) {
  const expected = process.env.SEED_SECRET;
  if (!expected) return false;
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || req.headers.get("x-seed-secret");
  return provided === expected;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "SEED_SECRET 환경변수가 설정되지 않았거나 secret이 일치하지 않습니다." }, { status: 401 });
  }
  const counts = await runSeed();
  return NextResponse.json({
    ok: true,
    counts,
    accounts: [
      { email: "admin@nomujang.kr", password: "test1234", role: "관리자" },
      { email: "site@nomujang.kr", password: "test1234", role: "현장소장" },
      { email: "foreman@nomujang.kr", password: "test1234", role: "반장(팀장)" },
    ],
  });
}

export async function POST(req: Request) {
  return GET(req);
}
