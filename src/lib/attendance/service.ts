import { getBatchById, getCurrentBatch, listBatches, type Batch } from "@/lib/db/queries/batches";
import {
  deleteAttendance,
  getAttendanceFor,
  listRecordsForDate,
  listRecordsInRange,
  listStudentHistory,
  upsertAttendance,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/lib/db/queries/attendance";
import {
  getActiveLeave,
  listLeavesOverlapping,
  listStudentLeaves,
} from "@/lib/db/queries/leaves";
import {
  findStudentByRoll,
  getStudentById,
  listStudents,
  type Student,
} from "@/lib/db/queries/students";
import { minDate, monthBounds, todayISO } from "@/lib/date";
import { fail, ok, type Result } from "@/lib/result";
import { compareRoll, summarize, type AttendanceSummary } from "./summary";

// Shared business logic for attendance, reports and the dashboard. Route
// handlers and Server Components call these; they never query the DB directly.

// ---------------------------------------------------------------- reports

/** Summary for a batch over [from, to]; defaults to batch start → min(end, today). */
export async function getBatchSummary(
  batch: Batch,
  from?: string,
  to?: string,
): Promise<AttendanceSummary> {
  const start = from ?? batch.startDate;
  const end = to ?? minDate(batch.endDate, todayISO());
  const [students, records, leaves] = await Promise.all([
    listStudents(batch.id),
    listRecordsInRange(batch.id, start, end),
    listLeavesOverlapping(batch.id, start, end),
  ]);
  return summarize({ students, records, leaves, from: start, to: end });
}

export async function getBatchesOverview(): Promise<
  Array<{ batch: Batch; summary: AttendanceSummary }>
> {
  const batches = await listBatches();
  return Promise.all(
    batches.map(async (batch) => ({ batch, summary: await getBatchSummary(batch) })),
  );
}

export async function getStudentSummary(student: Student, batch: Batch) {
  const from = batch.startDate;
  const to = minDate(batch.endDate, todayISO());
  const [records, leaves] = await Promise.all([
    listStudentHistory(student.id),
    listStudentLeaves(student.id),
  ]);
  const summary = summarize({
    students: [student],
    records: records.map((r) => ({ studentId: r.studentId, date: r.date, status: r.status })),
    leaves: leaves.map((l) => ({
      studentId: l.studentId,
      startDate: l.startDate,
      endDate: l.endDate,
    })),
    from,
    to,
  });
  return { summary: summary.students[0], records, leaves };
}

export async function getDashboard() {
  const batch = await getCurrentBatch();
  if (!batch) return null;
  const today = todayISO();
  const summary = await getBatchSummary(batch);
  const todayRow = summary.daily.find((d) => d.date === today) ?? {
    date: today,
    absent: 0,
    late: 0,
    leave: 0,
    present: summary.totals.totalInterns,
  };
  const topAbsentees = summary.students
    .filter((s) => s.absentDays > 0)
    .sort((a, b) => b.absentDays - a.absentDays || compareRoll(a.rollNumber, b.rollNumber))
    .slice(0, 5);
  return { batch, today, todayRow, summary, topAbsentees };
}

export async function getCalendarMonth(batch: Batch, month: string) {
  const { from, to } = monthBounds(month);
  const summary = await getBatchSummary(batch, from, to);
  return summary.daily;
}

// ------------------------------------------------------- attendance entry

export interface DayListRow {
  studentId: number;
  rollNumber: string;
  name: string;
  status: AttendanceStatus;
  remarks: string | null;
  /** "record" = marked attendance; "leave" = covered by an approved leave range */
  source: "record" | "leave";
}

export async function getAttendanceDay(
  batchId: number,
  date: string,
): Promise<DayListRow[]> {
  const [records, leaves] = await Promise.all([
    listRecordsForDate(batchId, date),
    listLeavesOverlapping(batchId, date, date),
  ]);
  const marked = new Set(records.map((r) => r.studentId));
  const rows: DayListRow[] = [
    ...records.map((r) => ({ ...r, source: "record" as const })),
    ...leaves
      .filter((l) => !marked.has(l.studentId))
      .map((l) => ({
        studentId: l.studentId,
        rollNumber: l.rollNumber,
        name: l.name,
        status: "leave" as const,
        remarks: l.reason,
        source: "leave" as const,
      })),
  ];
  return rows.sort((a, b) => compareRoll(a.rollNumber, b.rollNumber));
}

export interface LookupResult {
  student: Student;
  date: string;
  record: AttendanceRecord | null;
  leave: { startDate: string; endDate: string; reason: string | null } | null;
}

export async function lookupForAttendance(
  rollNumber: string,
  date: string,
): Promise<Result<LookupResult>> {
  const batch = await getCurrentBatch();
  if (!batch) return fail(409, "No current batch is set");
  const student = await findStudentByRoll(batch.id, rollNumber);
  if (!student) return fail(404, `No student with roll number ${rollNumber} in the current batch`);
  const [record, leave] = await Promise.all([
    getAttendanceFor(student.id, date),
    getActiveLeave(student.id, date),
  ]);
  return ok({
    student,
    date,
    record: record ?? null,
    leave: leave
      ? { startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason }
      : null,
  });
}

async function resolveCurrentStudent(
  studentId: number,
  date: string,
): Promise<Result<Student>> {
  if (date > todayISO()) return fail(400, "Cannot mark attendance for a future date");
  const [student, batch] = await Promise.all([getStudentById(studentId), getCurrentBatch()]);
  if (!student) return fail(404, "Student not found");
  if (!batch) return fail(409, "No current batch is set");
  if (student.batchId !== batch.id) {
    return fail(409, "Attendance can only be taken for the current batch");
  }
  return ok(student);
}

/** For clearing: find the student's batch directly; no need to match current batch. */
async function resolveStudentForDate(
  studentId: number,
  date: string,
): Promise<Result<Student>> {
  if (date > todayISO()) return fail(400, "Cannot clear attendance for a future date");
  const student = await getStudentById(studentId);
  if (!student) return fail(404, "Student not found");
  return ok(student);
}

export async function markAttendance(input: {
  studentId: number;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  userId: number;
}): Promise<Result<AttendanceRecord>> {
  const student = await resolveCurrentStudent(input.studentId, input.date);
  if (!student.ok) return student;
  const record = await upsertAttendance({
    studentId: input.studentId,
    date: input.date,
    status: input.status,
    remarks: input.remarks,
    markedBy: input.userId,
  });
  return ok(record);
}

/** Marks a student present again by removing their absence record. */
export async function clearAttendance(
  studentId: number,
  date: string,
): Promise<Result<{ removed: boolean }>> {
  const student = await resolveStudentForDate(studentId, date);
  if (!student.ok) return student;
  return ok({ removed: await deleteAttendance(studentId, date) });
}

export async function getBatchOrCurrent(batchId?: number): Promise<Batch | undefined> {
  return batchId ? getBatchById(batchId) : getCurrentBatch();
}
