import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { SessionPayload } from "./jwt";

// Server-side guards for Server Component pages. Middleware is only the first
// layer; every protected page re-checks the session itself.

export async function requirePageSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdminPage(): Promise<SessionPayload> {
  const session = await requirePageSession();
  if (session.role !== "admin") redirect("/");
  return session;
}
