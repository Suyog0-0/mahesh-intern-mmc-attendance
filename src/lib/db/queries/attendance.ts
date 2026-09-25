import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendanceRecords, students } from "@/drizzle/schema";

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type AttendanceStatus = AttendanceRecord["status"];

export interface DayRecordRow {
  studentId: number;
  rollNumber: string;
  name: string;
  status: AttendanceStatus;
  remarks: string | null;
}

export interface RangeRecordRow {
  studentId: number;
  date: string;
  status: AttendanceStatus;
}

/** Records are absences: one row per student per date; no row = present. */
export async function upsertAttendance(input: {
  studentId: number;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  markedBy: number;
}): Promise<AttendanceRecord> {
  const [row] = await db
    .insert(attendanceRecords)
    .values(input)
    .onConflictDoUpdate({
      target: [attendanceRecords.studentId, attendanceRecords.date],
      set: {
        status: input.status,
        remarks: input.remarks,
        markedBy: input.markedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

/** Deleting the record is how a student is (re)marked present. */
export async function deleteAttendance(
  studentId: number,
  date: string,
): Promise<boolean> {
  const rows = await db
    .delete(attendanceRecords)
    .where(
      and(eq(attendanceRecords.studentId, studentId), eq(attendanceRecords.date, date)),
    )
    .returning({ id: attendanceRecords.id });
  return rows.length > 0;
}

export async function getAttendanceFor(
  studentId: number,
  date: string,
): Promise<AttendanceRecord | undefined> {
  const [row] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(eq(attendanceRecords.studentId, studentId), eq(attendanceRecords.date, date)),
    )
    .limit(1);
  return row;
}

export async function listRecordsForDate(
  batchId: number,
  date: string,
): Promise<DayRecordRow[]> {
  return db
    .select({
      studentId: students.id,
      rollNumber: students.rollNumber,
      name: students.name,
      status: attendanceRecords.status,
      remarks: attendanceRecords.remarks,
    })
    .from(attendanceRecords)
    .innerJoin(students, eq(attendanceRecords.studentId, students.id))
    .where(and(eq(students.batchId, batchId), eq(attendanceRecords.date, date)))
    .orderBy(asc(students.rollNumber));
}

export async function listRecordsInRange(
  batchId: number,
  from: string,
  to: string,
): Promise<RangeRecordRow[]> {
  return db
    .select({
      studentId: attendanceRecords.studentId,
      date: attendanceRecords.date,
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .innerJoin(students, eq(attendanceRecords.studentId, students.id))
    .where(
      and(
        eq(students.batchId, batchId),
        gte(attendanceRecords.date, from),
        lte(attendanceRecords.date, to),
      ),
    );
}

export async function listStudentHistory(
  studentId: number,
): Promise<AttendanceRecord[]> {
  return db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.studentId, studentId))
    .orderBy(desc(attendanceRecords.date));
}
