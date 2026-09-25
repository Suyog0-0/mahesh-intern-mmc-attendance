import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";

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

export async function listUsers(): Promise<PublicUser[]> {
  return db.select(publicColumns).from(users).orderBy(asc(users.username));
}

export async function createUser(input: {
  username: string;
  passwordHash: string;
  role: "admin" | "staff";
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
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return rows.length > 0;
}
