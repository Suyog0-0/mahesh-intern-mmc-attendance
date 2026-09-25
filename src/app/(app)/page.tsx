import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guards";
import { getDashboard } from "@/lib/attendance/service";
import { Card } from "@/components/card";
import { TopAbsenteesList } from "@/components/top-absentees-list";
import { formatDate } from "@/lib/date";
import { ArrowRight, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  await requirePageSession();
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
  const presentPct = summary.totals.totalInterns
    ? Math.round((todayRow.present / summary.totals.totalInterns) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {formatDate(today)}
        </p>
        <h1 className="text-xl font-semibold">{batch.name}</h1>
      </div>

      {/* Hero: today's attendance at a glance */}
      <Card className="!p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Present today
            </p>
            <p className="mt-1 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {todayRow.present}
              <span className="ml-1.5 text-lg font-medium text-neutral-400">
                / {summary.totals.totalInterns}
              </span>
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {presentPct}% attendance today
            </p>
          </div>
          <Link
            href="/attendance?openModal=true"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7d1527] transition-colors dark:hover:bg-[#b82540]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Take attendance</span>
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-900">
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
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Batch to date</h2>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9E1B32] hover:underline dark:text-[#e07c8d]"
            >
              <span>Full report</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
            {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
          </p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">
                Absent records
              </dt>
              <dd className="text-lg font-semibold">
                {summary.totals.absentRecords}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">
                Late records
              </dt>
              <dd className="text-lg font-semibold">
                {summary.totals.lateRecords}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">
                Leave days
              </dt>
              <dd className="text-lg font-semibold">
                {summary.totals.leaveDays}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">
                Interns with absences
              </dt>
              <dd className="text-lg font-semibold">
                {summary.totals.studentsWithAbsences}
              </dd>
            </div>
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

