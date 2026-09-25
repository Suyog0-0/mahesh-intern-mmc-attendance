"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/card";
import { formatDate } from "@/lib/date";
import type { AttendanceSummary } from "@/lib/attendance/summary";

interface Props {
  batches: { id: number; name: string }[];
  batchId: number;
  summary: AttendanceSummary;
}

export function ReportView({ batches, batchId, summary }: Props) {
  const router = useRouter();

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams({ batchId: String(batchId), from: summary.from, to: summary.to, ...patch });
    router.push(`/reports?${params.toString()}`);
  }

  const exportHref = `/api/reports/export?batchId=${batchId}&from=${summary.from}&to=${summary.to}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Reports</h1>
        <a
          href={exportHref}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Export CSV
        </a>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">
            Batch
            <select
              value={batchId}
              onChange={(e) => updateParams({ batchId: e.target.value })}
              className="mt-1 block rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            From
            <input type="date" value={summary.from} onChange={(e) => updateParams({ from: e.target.value })} className="mt-1 block rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700" />
          </label>
          <label className="text-sm font-medium">
            To
            <input type="date" value={summary.to} onChange={(e) => updateParams({ to: e.target.value })} className="mt-1 block rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700" />
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMini label="Interns" value={summary.totals.totalInterns} />
        <StatMini label="Absent records" value={summary.totals.absentRecords} />
        <StatMini label="Late records" value={summary.totals.lateRecords} />
        <StatMini label="Leave days" value={summary.totals.leaveDays} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">
          By intern — {formatDate(summary.from)} to {formatDate(summary.to)}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th className="pb-2 pr-3">Roll</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3 text-right">Absent</th>
                <th className="pb-2 pr-3 text-right">Late</th>
                <th className="pb-2 pr-3 text-right">Leave</th>
                <th className="pb-2 pr-3 text-right">Total absent days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {summary.students.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 pr-3">{s.rollNumber}</td>
                  <td className="py-2 pr-3">{s.name}</td>
                  <td className="py-2 pr-3 text-right">{s.absenceCount}</td>
                  <td className="py-2 pr-3 text-right">{s.lateCount}</td>
                  <td className="py-2 pr-3 text-right">{s.leaveDays}</td>
                  <td className="py-2 pr-3 text-right font-medium">{s.absentDays}</td>
                </tr>
              ))}
              {summary.students.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-500 dark:text-neutral-400">
                    No students in this batch.
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

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </Card>
  );
}
