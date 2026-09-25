import { and, asc, desc, eq, getTableColumns, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaves, students, users } from "@/drizzle/schema";

export type Leave = typeof leaves.$inferSelect;

export interface LeaveRow {
  id: number;
  studentId: number;
  rollNumber: string;
  name: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdByName: string | null;
}

const leaveRowColumns = {
  id: leaves.id,
  studentId: leaves.studentId,
  rollNumber: students.rollNumber,
  name: students.name,
  startDate: leaves.startDate,
  endDate: leaves.endDate,
  reason: leaves.reason,
  createdByName: users.name,
};

export async function listLeavesForBatch(batchId: number): Promise<LeaveRow[]> {
  return db
    .select(leaveRowColumns)
    .from(leaves)
    .innerJoin(students, eq(leaves.studentId, students.id))
    .leftJoin(users, eq(leaves.createdBy, users.id))
    .where(eq(students.batchId, batchId))
    .orderBy(desc(leaves.startDate), asc(students.rollNumber));
}

/** Leaves whose date range overlaps [from, to] (inclusive). */
export async function listLeavesOverlapping(
  batchId: number,
  from: string,
  to: string,
): Promise<LeaveRow[]> {
  return db
    .select(leaveRowColumns)
    .from(leaves)
    .innerJoin(students, eq(leaves.studentId, students.id))
    .leftJoin(users, eq(leaves.createdBy, users.id))
    .where(
      and(eq(students.batchId, batchId), lte(leaves.startDate, to), gte(leaves.endDate, from)),
    );
}

export async function listStudentLeaves(
  studentId: number,
): Promise<Array<Leave & { createdByName: string | null }>> {
  return db
    .select({ ...getTableColumns(leaves), createdByName: users.name })
    .from(leaves)
    .leftJoin(users, eq(leaves.createdBy, users.id))
    .where(eq(leaves.studentId, studentId))
    .orderBy(desc(leaves.startDate));
}

export async function getActiveLeave(
  studentId: number,
  date: string,
): Promise<Leave | undefined> {
  const [row] = await db
    .select()
    .from(leaves)
    .where(
      and(eq(leaves.studentId, studentId), lte(leaves.startDate, date), gte(leaves.endDate, date)),
    )
    .limit(1);
  return row;
}

export async function createLeave(input: {
  studentId: number;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdBy: number;
}): Promise<Leave> {
  const [row] = await db.insert(leaves).values(input).returning();
  return row;
}

export async function deleteLeave(id: number): Promise<boolean> {
  const rows = await db.delete(leaves).where(eq(leaves.id, id)).returning({ id: leaves.id });
  return rows.length > 0;
}

export async function updateLeave(id: number, patch: {
  startDate: string;
  endDate: string;
  reason: string | null;
}): Promise<Leave | undefined> {
  const [row] = await db.update(leaves).set(patch).where(eq(leaves.id, id)).returning();
  return row;
}
