import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, ROLE_HOME, type Role } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  redirect(ROLE_HOME[session.user.role as Role] ?? "/login");
}
