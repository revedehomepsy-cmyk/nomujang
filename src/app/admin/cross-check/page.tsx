import { prisma } from "@/lib/prisma";
import CrossCheckClient from "./CrossCheckClient";

export const dynamic = "force-dynamic";

export default async function CrossCheckPage() {
  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });
  return <CrossCheckClient projects={projects} />;
}
