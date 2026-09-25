import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { SessionPayload } from "./jwt";
import { getUserRoleById } from "@/lib/db/queries/users";
import { hasAdminAccess } from "@/lib/auth/roles";

// Server-side guards for Server Component pages. Middleware is only the first
// layer; every protected page re-checks the session itself.

export async function requirePageSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = await getUserRoleById(session.userId);
  if (!role) redirect("/login");
  return { ...session, role };
}

export async function requireAdminPage(): Promise<SessionPayload> {
  const session = await requirePageSession();
  if (!hasAdminAccess(session.role)) redirect("/");
  return session;
}
