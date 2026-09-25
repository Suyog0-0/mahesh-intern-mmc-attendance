import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import type { AppRole } from "@/lib/auth/roles";

export type UserRow = typeof users.$inferSelect;
export type PublicUser = Omit<UserRow, "passwordHash">;

const publicColumns = {
  id: users.id,
  username: users.username,
  role: users.role,
  name: users.name,
  createdAt: users.createdAt,
};

export async function getUserByUsername(
  username: string,
): Promise<UserRow | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return row;
}

export async function getUserRoleById(id: number): Promise<AppRole | undefined> {
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  return row?.role;
}

export async function listUsers(): Promise<PublicUser[]> {
  return db.select(publicColumns).from(users).orderBy(asc(users.username));
}

export async function createUser(input: {
  username: string;
  passwordHash: string;
  role: AppRole;
  name: string;
}): Promise<PublicUser> {
  const [row] = await db.insert(users).values(input).returning(publicColumns);
  return row;
}

export async function updateUserPasswordHash(
  id: number,
  passwordHash: string,
): Promise<boolean> {
  const rows = await db
    .update(users)
    .set({ passwordHash })
    .where(
      and(
        eq(users.id, id),
        ne(users.role, "superadmin"),
      ),
    )
    .returning({ id: users.id });
  return rows.length > 0;
}

export async function updateUser(
  id: number,
  input: Partial<{ name: string; username: string; role: AppRole }>,
): Promise<PublicUser | null> {
  const [row] = await db
    .update(users)
    .set(input)
    .where(
      and(
        eq(users.id, id),
        ne(users.role, "superadmin"),
      ),
    )
    .returning(publicColumns);
  return row ?? null;
}

export async function deleteUser(
  id: number,
): Promise<boolean> {
  const rows = await db
    .delete(users)
    .where(
      and(
        eq(users.id, id),
        ne(users.role, "superadmin"),
      ),
    )
    .returning({ id: users.id });
  return rows.length > 0;
}

/** The authenticated user may update their own password, including super-admins. */
export async function updateOwnPasswordHash(
  id: number,
  passwordHash: string,
): Promise<boolean> {
  const rows = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return rows.length > 0;
}
