import { prisma } from "@/lib/prisma";
import AttendanceClient from "./AttendanceClient";

export const dynamic = "force-dynamic";

export default async function ForemanAttendancePage() {
  const projects = await prisma.project.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return <AttendanceClient projects={projects} />;
}
