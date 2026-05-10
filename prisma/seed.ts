import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  // 기본 공정
  const workTypes = [
    "철근",
    "형틀",
    "콘크리트",
    "조적",
    "미장",
    "방수",
    "타일",
    "도장",
    "전기",
    "설비",
    "토공",
    "잡부",
  ];
  for (const name of workTypes) {
    await prisma.workType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 기본 계정
  await prisma.user.upsert({
    where: { email: "admin@nomujang.kr" },
    update: {},
    create: {
      email: "admin@nomujang.kr",
      passwordHash,
      name: "관리자",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "site@nomujang.kr" },
    update: {},
    create: {
      email: "site@nomujang.kr",
      passwordHash,
      name: "현장소장",
      role: "SITE_MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "foreman@nomujang.kr" },
    update: {},
    create: {
      email: "foreman@nomujang.kr",
      passwordHash,
      name: "김반장",
      role: "FOREMAN",
      isTeamLead: true,
    },
  });

  // 샘플 프로젝트
  await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "강남 오피스텔 신축",
      address: "서울 강남구",
    },
  });

  console.log("Seed completed.");
  console.log("- admin@nomujang.kr / test1234 (관리자)");
  console.log("- site@nomujang.kr / test1234 (현장소장)");
  console.log("- foreman@nomujang.kr / test1234 (반장)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
