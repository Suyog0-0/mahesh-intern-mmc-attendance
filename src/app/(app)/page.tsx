import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guards";
import { getDashboard } from "@/lib/attendance/service";
import { Card, StatTile } from "@/components/card";
import { formatDate } from "@/lib/date";

export default async function DashboardPage() {
  await requirePageSession();
  const dashboard = await getDashboard();

  if (!dashboard) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No current batch is set.</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Ask an admin to create a batch and mark it current from the Batches page.
        </p>
      </Card>
    );
  }

  const { batch, today, todayRow, summary, topAbsentees } = dashboard;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{batch.name}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDate(batch.startDate)} – {formatDate(batch.endDate)} · Today, {formatDate(today)}
          </p>
        </div>
        <Link
          href="/attendance"
          className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
        >
          Take attendance
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total interns" value={summary.totals.totalInterns} />
        <StatTile label="Present today" value={todayRow.present} tone="text-emerald-600 dark:text-emerald-400" />
        <StatTile label="Absent today" value={todayRow.absent} tone="text-red-600 dark:text-red-400" />
        <StatTile label="On leave today" value={todayRow.leave} tone="text-blue-600 dark:text-blue-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Batch to date</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Absent records</dt>
              <dd className="text-lg font-semibold">{summary.totals.absentRecords}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Late records</dt>
              <dd className="text-lg font-semibold">{summary.totals.lateRecords}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Leave days</dt>
              <dd className="text-lg font-semibold">{summary.totals.leaveDays}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Interns with absences</dt>
              <dd className="text-lg font-semibold">{summary.totals.studentsWithAbsences}</dd>
            </div>
          </dl>
          <Link href="/reports" className="mt-4 inline-block text-sm font-medium text-[#9E1B32] hover:underline dark:text-[#e07c8d]">
            View full report →
          </Link>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">Most absences</h2>
          {topAbsentees.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No absences recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topAbsentees.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-neutral-400">{s.rollNumber}</span> {s.name}
                  </span>
                  <span className="font-medium">{s.absentDays} day{s.absentDays === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
