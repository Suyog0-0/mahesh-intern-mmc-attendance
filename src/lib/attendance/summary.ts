import { eachDate, maxDate, minDate } from "@/lib/date";
import type { AttendanceStatus } from "./types";

// Pure attendance math. This is the ONLY place totals are calculated, so the
// dashboard, calendar, reports, CSV export and student pages always agree.
//
// Attendance rows represent exceptions or an explicit department presence.
// No row for a student+date means ordinary present.
//
// Definitions (documented in .claude/docs/architecture.md):
//  - Effective status of a student on a date: the attendance record if one
//    exists; otherwise "leave" if a leaves-table range covers that date;
//    otherwise present. A record always wins over a leave range; explicit
//    `present` rows are attended and retain their department for the log.
//  - absenceCount  = number of `absent` records
//  - lateCount     = number of `late` records
//  - leaveDays     = number of days with effective status `leave`
//  - absentDays    = absenceCount + leaveDays  (days the student was not there;
//                    late days are attended, so they are not included)
//  - present (per day) = totalInterns - absent - leave (late counts as present)
// Calendar days are counted; there is no working-day/weekend calendar yet.

export type { AttendanceStatus } from "./types";

export interface StudentInfo {
  id: number;
  rollNumber: string;
  name: string;
  postingPeriod: string;
}
export interface RecordInfo {
  studentId: number;
  date: string;
  status: AttendanceStatus;
}
export interface LeaveRange {
  studentId: number;
  startDate: string;
  endDate: string;
}

export interface StudentSummary extends StudentInfo {
  absenceCount: number;
  lateCount: number;
  leaveDays: number;
  absentDays: number;
}
export interface DailySummary {
  date: string;
  absent: number;
  late: number;
  leave: number;
  present: number;
}
export interface SummaryTotals {
  totalInterns: number;
  totalRecords: number; // all attendance records in range (any status)
  absentRecords: number;
  lateRecords: number;
  leaveDays: number;
  studentsWithAbsences: number; // students with absentDays > 0
  totalAbsentDays: number;
}
export interface AttendanceSummary {
  from: string;
  to: string;
  students: StudentSummary[];
  daily: DailySummary[]; // one entry per date in [from, to]
  totals: SummaryTotals;
}

export function compareRoll(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function summarize(input: {
  students: StudentInfo[];
  records: RecordInfo[];
  leaves: LeaveRange[];
  from: string;
  to: string;
}): AttendanceSummary {
  const { students, records, leaves, from, to } = input;
  const dates = eachDate(from, to);
  const ids = new Set(students.map((s) => s.id));

  const recordsByStudent = new Map<number, Map<string, AttendanceStatus>>();
  let totalRecords = 0;
  for (const r of records) {
    if (!ids.has(r.studentId) || r.date < from || r.date > to) continue;
    let m = recordsByStudent.get(r.studentId);
    if (!m) recordsByStudent.set(r.studentId, (m = new Map()));
    m.set(r.date, r.status);
    totalRecords++;
  }

  const leaveDatesByStudent = new Map<number, Set<string>>();
  for (const l of leaves) {
    if (!ids.has(l.studentId)) continue;
    let set = leaveDatesByStudent.get(l.studentId);
    if (!set) leaveDatesByStudent.set(l.studentId, (set = new Set()));
    for (const d of eachDate(maxDate(l.startDate, from), minDate(l.endDate, to))) {
      set.add(d);
    }
  }

  const dailyCounts = new Map(
    dates.map((d) => [d, { absent: 0, late: 0, leave: 0 }]),
  );

  const rows: StudentSummary[] = students.map((s) => {
    let absenceCount = 0;
    let lateCount = 0;
    let leaveDays = 0;
    const recs = recordsByStudent.get(s.id);
    if (recs) {
      for (const [date, status] of recs) {
        const day = dailyCounts.get(date);
        if (status === "absent") {
          absenceCount++;
          if (day) day.absent++;
        } else if (status === "late") {
          lateCount++;
          if (day) day.late++;
        } else if (status === "leave") {
          leaveDays++;
          if (day) day.leave++;
        }
      }
    }
    const ranged = leaveDatesByStudent.get(s.id);
    if (ranged) {
      for (const date of ranged) {
        if (recs?.has(date)) continue; // a record wins over a leave range
        leaveDays++;
        const day = dailyCounts.get(date);
        if (day) day.leave++;
      }
    }
    return {
      ...s,
      absenceCount,
      lateCount,
      leaveDays,
      absentDays: absenceCount + leaveDays,
    };
  });
  rows.sort((a, b) => compareRoll(a.rollNumber, b.rollNumber));

  const totalInterns = students.length;
  const daily: DailySummary[] = dates.map((date) => {
    const c = dailyCounts.get(date)!;
    return { date, ...c, present: totalInterns - c.absent - c.leave };
  });

  const totals: SummaryTotals = {
    totalInterns,
    totalRecords,
    absentRecords: rows.reduce((n, r) => n + r.absenceCount, 0),
    lateRecords: rows.reduce((n, r) => n + r.lateCount, 0),
    leaveDays: rows.reduce((n, r) => n + r.leaveDays, 0),
    studentsWithAbsences: rows.filter((r) => r.absentDays > 0).length,
    totalAbsentDays: rows.reduce((n, r) => n + r.absentDays, 0),
  };

  return { from, to, students: rows, daily, totals };
}
