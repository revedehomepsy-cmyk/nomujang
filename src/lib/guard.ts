import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, ROLE_HOME, type Role } from "./auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(allowed: Role | Role[]) {
  const session = await requireSession();
  const role = session.user.role;
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedArr.includes(role)) {
    redirect(ROLE_HOME[role] ?? "/login");
  }
  return session;
}
