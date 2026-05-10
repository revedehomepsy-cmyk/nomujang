import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkUnitsClient from "./WorkUnitsClient";

export const dynamic = "force-dynamic";

export default async function WorkUnitsPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isTeamLead) {
    redirect("/foreman");
  }
  const [projects, workTypes] = await Promise.all([
    prisma.project.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.workType.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <WorkUnitsClient projects={projects} workTypes={workTypes} />;
}
