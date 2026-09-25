import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { batches, students } from "@/drizzle/schema";

export type Batch = typeof batches.$inferSelect;

export async function listBatches(): Promise<Batch[]> {
  return db.select().from(batches).orderBy(desc(batches.startDate));
}

export async function getBatchById(id: number): Promise<Batch | undefined> {
  const [row] = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
  return row;
}

export async function getCurrentBatch(): Promise<Batch | undefined> {
  const [row] = await db
    .select()
    .from(batches)
    .where(eq(batches.isCurrent, true))
    .limit(1);
  return row;
}

export async function countStudentsByBatch(): Promise<Map<number, number>> {
  const rows = await db
    .select({ batchId: students.batchId, total: count() })
    .from(students)
    .groupBy(students.batchId);
  return new Map(rows.map((r) => [r.batchId, r.total]));
}

export async function createBatch(input: {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}): Promise<Batch> {
  if (input.isCurrent) {
    // neon-http has no interactive transactions; db.batch runs atomically.
    const [, inserted] = await db.batch([
      db.update(batches).set({ isCurrent: false }).where(eq(batches.isCurrent, true)),
      db.insert(batches).values(input).returning(),
    ]);
    return inserted[0];
  }
  const [row] = await db.insert(batches).values(input).returning();
  return row;
}

export async function updateBatch(
  id: number,
  patch: { name?: string; startDate?: string; endDate?: string },
): Promise<Batch | undefined> {
  if (Object.keys(patch).length === 0) return getBatchById(id);
  const [row] = await db
    .update(batches)
    .set(patch)
    .where(eq(batches.id, id))
    .returning();
  return row;
}

/** Makes `id` the only current batch (caller must verify it exists). */
export async function setCurrentBatch(id: number): Promise<Batch> {
  const [, updated] = await db.batch([
    db.update(batches).set({ isCurrent: false }).where(eq(batches.isCurrent, true)),
    db.update(batches).set({ isCurrent: true }).where(eq(batches.id, id)).returning(),
  ]);
  return updated[0];
}
