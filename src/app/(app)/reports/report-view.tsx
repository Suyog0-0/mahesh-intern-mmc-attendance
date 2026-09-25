"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/card";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { formatDate } from "@/lib/date";
import type { AttendanceSummary } from "@/lib/attendance/summary";

interface Props {
  batches: { id: number; name: string }[];
  batchId: number;
  summary: AttendanceSummary;
}

export function ReportView({ batches, batchId, summary }: Props) {
  const router = useRouter();
  const { openStudent } = useStudentDrawer();
  const [searchTerm, setSearchTerm] = useState("");

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams({
      batchId: String(batchId),
      from: summary.from,
      to: summary.to,
      ...patch,
    });
    router.push(`/reports?${params.toString()}`);
  }

  const exportHref = `/api/reports/export?batchId=${batchId}&from=${summary.from}&to=${summary.to}`;

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return summary.students;
    return summary.students.filter(
      (s) =>
        s.rollNumber.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    );
  }, [summary.students, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Attendance Reports
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Summary breakdown and exportable attendance metrics
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300/80 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <Download className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
          <span>Export CSV Summary</span>
        </a>
      </div>

      {/* Date & Batch Filter Card */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Filter Batch
            <select
              value={batchId}
              onChange={(e) => updateParams({ batchId: e.target.value })}
              className="mt-1.5 block w-full sm:w-48 rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs font-medium text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            From Date
            <input
              type="date"
              value={summary.from}
              onChange={(e) => updateParams({ from: e.target.value })}
              className="mt-1.5 block rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs font-medium text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            To Date
            <input
              type="date"
              value={summary.to}
              onChange={(e) => updateParams({ to: e.target.value })}
              className="mt-1.5 block rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs font-medium text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatMini label="Total Interns" value={summary.totals.totalInterns} />
        <StatMini label="Absence Records" value={summary.totals.absentRecords} tone="text-red-600 dark:text-red-400" />
        <StatMini label="Late Markings" value={summary.totals.lateRecords} tone="text-amber-600 dark:text-amber-400" />
        <StatMini label="Leave Days" value={summary.totals.leaveDays} tone="text-blue-600 dark:text-blue-400" />
      </div>

      {/* Intern Breakdown Table / Cards */}
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
              Intern Breakdown ({filteredStudents.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Period: {formatDate(summary.from)} to {formatDate(summary.to)}
            </p>
          </div>

          {/* Intern Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search intern name or roll #..."
              className="w-full rounded-lg border border-neutral-300/80 bg-white pl-9 pr-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="grid gap-3 sm:hidden">
          {filteredStudents.map((s) => (
            <div
              key={s.id}
              onClick={() => openStudent(s.id)}
              className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:active:bg-neutral-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#9E1B32] dark:text-[#e8a3b0]">
                  #{s.rollNumber}
                </span>
                <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                  {s.name}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 border-t border-neutral-200/60 pt-2.5 text-center text-xs dark:border-neutral-800">
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-semibold">Absent</p>
                  <p className="font-bold text-red-600 dark:text-red-400">{s.absenceCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-semibold">Late</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{s.lateCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-semibold">Leave</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{s.leaveDays}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-semibold">Off</p>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{s.absentDays}d</p>
                </div>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No matching interns found.
            </p>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Roll #</th>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3 text-right">Absent</th>
                <th scope="col" className="px-4 py-3 text-right">Late</th>
                <th scope="col" className="px-4 py-3 text-right">Leave</th>
                <th scope="col" className="px-4 py-3 text-right">Total Days Off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {filteredStudents.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openStudent(s.id)}
                  className="group cursor-pointer transition-colors hover:bg-neutral-50/90 dark:hover:bg-neutral-800/40"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openStudent(s.id);
                    }
                  }}
                  title="Click to view full intern history"
                >
                  <td className="px-4 py-3 font-mono font-medium text-neutral-500 group-hover:text-[#9E1B32] dark:text-neutral-400 dark:group-hover:text-[#e8a3b0]">
                    {s.rollNumber}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900 group-hover:text-[#9E1B32] dark:text-neutral-100 dark:group-hover:text-[#e8a3b0]">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                    {s.absenceCount}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                    {s.lateCount}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                    {s.leaveDays}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-50">
                    {s.absentDays}d
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    No matching interns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatMini({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <span className={`text-xl font-bold tracking-tight ${tone ?? "text-neutral-900 dark:text-neutral-50"}`}>
        {value}
      </span>
    </Card>
  );
}
