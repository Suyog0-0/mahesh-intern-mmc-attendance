import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./jwt";
import type { AppRole } from "@/lib/auth/roles";
import { getUserRoleById } from "@/lib/db/queries/users";

export async function createSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
) {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireRole(
  roles: AppRole[],
): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  const role = await getUserRoleById(session.userId);
  if (!role || !roles.includes(role)) return null;
  return { ...session, role };
}
