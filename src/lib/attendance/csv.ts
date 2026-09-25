import type { AttendanceSummary } from "./summary";
import { formatDate } from "@/lib/date";

// Cells that start with these characters can be executed as formulas by
// spreadsheet apps; prefix them so exported names/remarks stay inert.
function cell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function summaryToCsv(summary: AttendanceSummary): string {
  const header = [
    "Roll No",
    "Name",
    "Posting Period",
    "Absence Count",
    "Late Count",
    "Leave Days",
    "Total Absent Days",
  ];
  const rows = summary.students.map((s) => [
    s.rollNumber,
    s.name,
    s.postingPeriod
      .split(/\s+to\s+|\s+–\s+/)
      .map((part) => /^\d{4}-\d{2}-\d{2}$/.test(part) ? formatDate(part) : part)
      .join(" – "),
    s.absenceCount,
    s.lateCount,
    s.leaveDays,
    s.absentDays,
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
