import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guards";
import { getDashboard } from "@/lib/attendance/service";
import { Card } from "@/components/card";
import { TopAbsenteesList } from "@/components/top-absentees-list";
import { formatDate } from "@/lib/date";
import { ArrowRight, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await requirePageSession();
  const dashboard = await getDashboard();

  if (!dashboard) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
        <p className="font-medium">No current batch is set.</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Ask an admin to create a batch and mark it current from the Batches
          page.
        </p>
      </Card>
    );
  }

  const { batch, today, todayRow, summary, topAbsentees } = dashboard;
  const hasInterns = summary.totals.totalInterns > 0;
  const recentDays = summary.daily.slice(-7);
  const recentInternDays = recentDays.length * summary.totals.totalInterns;
  const recentAttendancePct = recentInternDays
    ? Math.round((recentDays.reduce((total, day) => total + day.present, 0) / recentInternDays) * 100)
    : 0;
  const recentAbsent = recentDays.reduce((total, day) => total + day.absent, 0);
  const recentLate = recentDays.reduce((total, day) => total + day.late, 0);
  const recentLeave = recentDays.reduce((total, day) => total + day.leave, 0);
  const presentPct = summary.totals.totalInterns
    ? Math.round((todayRow.present / summary.totals.totalInterns) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <Calendar className="h-4 w-4" />
          {formatDate(today)}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{batch.name}</h1>
        </div>
        {hasInterns && <span className="hidden rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-500 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">{summary.totals.totalInterns} interns</span>}
      </div>

      {/* Hero: today's attendance at a glance */}
      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {hasInterns ? "Present today" : "Interns needed"}
            </p>
            <p className="mt-1 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {hasInterns ? todayRow.present : "—"}
              {hasInterns && <span className="ml-1.5 text-lg font-medium text-neutral-400">
                / {summary.totals.totalInterns}
              </span>}
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {hasInterns ? `${presentPct}% attendance today` : "Add interns to this batch before recording attendance."}
            </p>
          </div>
          {hasInterns ? (
            <Link href="/attendance?openModal=true" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7d1527] dark:hover:bg-[#b82540]">
              <CheckCircle2 className="h-4 w-4" />
              <span>Take attendance</span>
            </Link>
          ) : session.role === "admin" ? (
            <Link href="/students" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7d1527] dark:hover:bg-[#b82540]">
              <CheckCircle2 className="h-4 w-4" />
              <span>Add interns</span>
            </Link>
          ) : null}
        </div>
        {hasInterns && <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-900">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <span className="text-sm">
              <strong>{todayRow.absent}</strong>{" "}
              <span className="text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                absent
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <span className="text-sm">
              <strong>{todayRow.late}</strong>{" "}
              <span className="text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                late
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            <span className="text-sm">
              <strong>{todayRow.leave}</strong>{" "}
              <span className="text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                on leave
              </span>
            </span>
          </div>
        </div>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent attendance</h2>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9E1B32] hover:underline dark:text-[#e07c8d]"
            >
              <span>Full report</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
            Last {recentDays.length} days · daily average
          </p>
          <div className="mb-4 flex items-end gap-2 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{recentAttendancePct}%</span>
            <span className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">average attendance</span>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-neutral-100 text-sm dark:divide-neutral-800">
            <div className="pr-2"><dt className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">Absent</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{recentAbsent}</dd></div>
            <div className="px-3"><dt className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Late</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{recentLate}</dd></div>
            <div className="pl-3"><dt className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Leave</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{recentLeave}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">Most absences</h2>
          <TopAbsenteesList absentees={topAbsentees} />
        </Card>
      </div>
    </div>
  );
}
