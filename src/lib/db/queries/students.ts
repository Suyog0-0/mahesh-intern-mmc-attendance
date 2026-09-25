import { and, asc, eq, ilike, or } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { attendanceRecords, leaves, students } from "@/drizzle/schema";

export type Student = typeof students.$inferSelect;

export const listStudents = cache(async (
  batchId: number,
  search?: string,
): Promise<Student[]> => {
  const term = search?.trim();
  const escaped = term?.replace(/[\\%_]/g, (c) => `\\${c}`);
  return db
    .select()
    .from(students)
    .where(
      and(
        eq(students.batchId, batchId),
        escaped
          ? or(
              ilike(students.name, `%${escaped}%`),
              ilike(students.rollNumber, `%${escaped}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(students.rollNumber));
});

export const getStudentById = cache(async (id: number): Promise<Student | undefined> => {
  const [row] = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return row;
});

export async function findStudentByRoll(
  batchId: number,
  rollNumber: string,
): Promise<Student | undefined> {
  const [row] = await db
    .select()
    .from(students)
    .where(and(eq(students.batchId, batchId), eq(students.rollNumber, rollNumber)))
    .limit(1);
  return row;
}

export async function createStudent(input: {
  batchId: number;
  rollNumber: string;
  name: string;
  postingPeriod: string;
  remarks: string | null;
}): Promise<Student> {
  const [row] = await db.insert(students).values(input).returning();
  return row;
}

export async function updateStudent(
  id: number,
  patch: {
    batchId?: number;
    rollNumber?: string;
    name?: string;
    postingPeriod?: string;
    remarks?: string | null;
  },
): Promise<Student | undefined> {
  const [row] = await db
    .update(students)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(students.id, id))
    .returning();
  return row;
}

/** Deletes a student together with their attendance records and leaves. */
export async function deleteStudentWithRecords(id: number): Promise<void> {
  await db.batch([
    db.delete(attendanceRecords).where(eq(attendanceRecords.studentId, id)),
    db.delete(leaves).where(eq(leaves.studentId, id)),
    db.delete(students).where(eq(students.id, id)),
  ]);
}
