"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, Eye, FileSpreadsheet, ListFilter, Search } from "lucide-react";
import { Card } from "@/components/card";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { formatDate } from "@/lib/date";
import type { AttendanceSummary } from "@/lib/attendance/summary";
import { Pagination } from "@/components/pagination";
import { NepaliDateInput } from "@/components/nepali-date-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatPersonName } from "@/lib/utils";

interface Props {
  batches: { id: number; name: string }[];
  batchId: number;
  summary: AttendanceSummary;
}

export function ReportView({ batches, batchId, summary }: Props) {
  const router = useRouter();
  const { openStudent } = useStudentDrawer();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

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
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const visiblePage = Math.min(page, pageCount);
  const visibleStudents = filteredStudents.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);

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
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300/80 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <Download className="h-4 w-4 text-[#1E4F91] dark:text-[#A9C5EA]" />
          <span>Export CSV Summary</span>
        </a>
      </div>

      {/* Date & Batch Filter Card */}
      <Card className="border-neutral-200/80 p-3 sm:p-3.5 dark:border-neutral-800">
        <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
          <ListFilter className="h-3.5 w-3.5 text-[#1E4F91] dark:text-[#A9C5EA]" aria-hidden="true" />
          Report filters
        </div>
        <div className="grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(10rem,1.3fr)_minmax(9rem,1fr)_minmax(9rem,1fr)] sm:gap-3">
          <label className="min-w-0 text-[10px] font-semibold leading-3 text-neutral-600 dark:text-neutral-400">
            <span className="mb-1 flex items-center gap-1"><FileSpreadsheet className="h-3 w-3 text-violet-600 dark:text-violet-400" aria-hidden="true" />Batch</span>
            <Select value={String(batchId)} onValueChange={(value) => updateParams({ batchId: value })}>
              <SelectTrigger className="report-filter-control report-filter-select h-10 rounded-lg border-neutral-200 bg-neutral-50 text-[11px] font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
            {batches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
            ))}
              </SelectContent>
            </Select>
          </label>
          <label className="min-w-0 text-[10px] font-semibold leading-3 text-neutral-600 dark:text-neutral-400">
            <span className="mb-1 flex items-center gap-1"><CalendarDays className="h-3 w-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />From date</span>
            <NepaliDateInput
              value={summary.from}
              onChange={(value) => updateParams({ from: value })}
              className="report-filter-control report-date-input h-10 w-full min-w-0 border-blue-100 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20"
            />
          </label>
          <label className="min-w-0 text-[10px] font-semibold leading-3 text-neutral-600 dark:text-neutral-400">
            <span className="mb-1 flex items-center gap-1"><CalendarDays className="h-3 w-3 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />To date</span>
            <NepaliDateInput
              value={summary.to}
              onChange={(value) => updateParams({ to: value })}
              className="report-filter-control report-date-input h-10 w-full min-w-0 border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20"
            />
          </label>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
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
              <FileSpreadsheet className="h-4 w-4 text-[#1E4F91] dark:text-[#A9C5EA]" />
              Intern Breakdown ({filteredStudents.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Period: {formatDate(summary.from)} to {formatDate(summary.to)}
            </p>
          </div>

          {/* Intern Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search intern name or roll #..."
              className="w-full rounded-lg border border-neutral-300/80 bg-white pl-9 pr-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-[#1E4F91] focus:ring-2 focus:ring-[#1E4F91]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Mobile Stacked Card View */}
        {/* Responsive table with compact card rows on mobile */}
        <div className="hidden overflow-x-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800 lg:block">
          <Table className="w-full min-w-[720px] text-left text-xs">
            <TableHeader>
            <TableRow className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <TableHead scope="col" className="px-4 py-3">Roll #</TableHead>
                <TableHead scope="col" className="px-4 py-3">Name</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-right">Absent</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-right">Late</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-right">Leave</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-right">Total Days Off</TableHead>
                <TableHead scope="col" className="px-3 py-3 text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {visibleStudents.map((s) => (
                <TableRow
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
                  <TableCell data-label="Roll #" className="px-4 py-3 font-mono font-medium text-neutral-500 group-hover:text-[#1E4F91] dark:text-neutral-400 dark:group-hover:text-[#A9C5EA]">
                    {s.rollNumber}
                  </TableCell>
                  <TableCell data-label="Name" className="px-4 py-3 font-semibold text-neutral-900 group-hover:text-[#1E4F91] dark:text-neutral-100 dark:group-hover:text-[#A9C5EA]">
                    {formatPersonName(s.name)}
                  </TableCell>
                  <TableCell data-label="Absent" className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                    {s.absenceCount}
                  </TableCell>
                  <TableCell data-label="Late" className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                    {s.lateCount}
                  </TableCell>
                  <TableCell data-label="Leave" className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                    {s.leaveDays}
                  </TableCell>
                  <TableCell data-label="Total Days Off" className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-50">
                    {s.absentDays}d
                  </TableCell>
                  <TableCell data-label="Profile" className="px-3 py-2 text-right">
                    <button type="button" aria-label={`View ${s.name} profile`} onClick={(event) => { event.stopPropagation(); openStudent(s.id); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-[#1E4F91]/8 hover:text-[#1E4F91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:text-neutral-400 dark:hover:text-[#A9C5EA]">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {summary.students.length === 0 ? "No interns are in this batch yet." : "No matching interns found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm lg:hidden dark:border-neutral-800 dark:bg-neutral-900">
          <Table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <caption className="sr-only">Intern attendance breakdown. Select a row to open an intern profile.</caption>
            <TableHeader className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-800">
              <TableRow className="border-b border-neutral-200 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                <TableHead scope="col" className="sticky left-0 z-20 bg-neutral-50 px-3 py-3 dark:bg-neutral-800">Intern</TableHead>
                <TableHead scope="col" className="px-3 py-3 text-right">Absent</TableHead>
                <TableHead scope="col" className="px-3 py-3 text-right">Late</TableHead>
                <TableHead scope="col" className="px-3 py-3 text-right">Leave</TableHead>
                <TableHead scope="col" className="px-3 py-3 text-right">Days off</TableHead>
                <TableHead scope="col" className="px-3 py-3 text-center">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {visibleStudents.map((student) => (
                <TableRow key={student.id} onClick={() => openStudent(student.id)} className="cursor-pointer transition-colors hover:bg-blue-50/70 dark:hover:bg-blue-950/20">
                  <TableHead scope="row" className="sticky left-0 bg-white px-3 py-3 text-left dark:bg-neutral-900">
                    <span className="block whitespace-nowrap font-mono text-[10px] font-semibold text-[#1E4F91] dark:text-[#A9C5EA]">Roll #{student.rollNumber}</span>
                    <span className="mt-0.5 block max-w-[11rem] truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">{formatPersonName(student.name)}</span>
                  </TableHead>
                  <TableCell className="px-3 py-3 text-right font-semibold tabular-nums text-red-700 dark:text-red-300">{student.absenceCount}</TableCell>
                  <TableCell className="px-3 py-3 text-right font-semibold tabular-nums text-amber-700 dark:text-amber-300">{student.lateCount}</TableCell>
                  <TableCell className="px-3 py-3 text-right font-semibold tabular-nums text-blue-700 dark:text-blue-300">{student.leaveDays}</TableCell>
                  <TableCell className="px-3 py-3 text-right font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{student.absentDays}</TableCell>
                  <TableCell className="px-3 py-2 text-center"><button type="button" aria-label={`View ${student.name} profile`} onClick={(event) => { event.stopPropagation(); openStudent(student.id); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-[#1E4F91]/10 hover:text-[#1E4F91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:text-neutral-400 dark:hover:text-[#A9C5EA]"><Eye className="h-4 w-4" aria-hidden="true" /></button></TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && <TableRow><TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">{summary.students.length === 0 ? "No interns are in this batch yet." : "No matching interns found."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <Pagination page={visiblePage} pageCount={pageCount} total={filteredStudents.length} pageSize={pageSize} onPageChange={setPage} />
      </Card>
    </div>
  );
}

function StatMini({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="flex min-w-0 flex-col gap-1.5 p-2.5 sm:p-4">
      <span className="min-h-6 text-[9px] font-bold uppercase leading-3 tracking-wide text-neutral-500 sm:min-h-0 sm:text-[11px] sm:leading-normal sm:text-neutral-400">
        {label}
      </span>
      <span className={`text-lg font-bold tracking-tight sm:text-xl ${tone ?? "text-neutral-900 dark:text-neutral-50"}`}>
        {value}
      </span>
    </Card>
  );
}
