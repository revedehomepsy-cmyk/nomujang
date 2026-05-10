import { prisma } from "@/lib/prisma";
import DailyClient from "./DailyClient";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const [projects, workTypes] = await Promise.all([
    prisma.project.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.workType.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <DailyClient projects={projects} workTypes={workTypes} />;
}
