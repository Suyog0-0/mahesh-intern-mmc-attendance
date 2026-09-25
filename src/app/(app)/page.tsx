import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guards";
import { getDashboard } from "@/lib/attendance/service";
import { Card } from "@/components/card";
import { formatDate } from "@/lib/date";

export default async function DashboardPage() {
  await requirePageSession();
  const dashboard = await getDashboard();

  if (!dashboard) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatDate(today)}
        </p>
        <h1 className="text-xl font-semibold">{batch.name}</h1>
      </div>

      {/* Hero: today's attendance at a glance */}
      <Card className="!p-5">
        <div className="flex items-center justify-between gap-4">
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
            href="/attendance"
            className="shrink-0 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
          >
            Take attendance
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-900">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <span className="text-sm">
              <strong>{todayRow.absent}</strong>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                absent
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <span className="text-sm">
              <strong>{todayRow.late}</strong>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                late
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            <span className="text-sm">
              <strong>{todayRow.leave}</strong>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
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
              className="text-xs font-medium text-[#9E1B32] hover:underline dark:text-[#e07c8d]"
            >
              Full report →
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
          {topAbsentees.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No absences recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
              {topAbsentees.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 truncate">
                    <span className="text-neutral-400">{s.rollNumber}</span>{" "}
                    {s.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    {s.absentDays} day{s.absentDays === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
