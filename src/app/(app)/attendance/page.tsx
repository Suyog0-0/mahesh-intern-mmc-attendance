import { Suspense } from "react";
import { requirePageSession } from "@/lib/auth/page-guards";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { listStudents } from "@/lib/db/queries/students";
import { getAttendanceDay } from "@/lib/attendance/service";
import { todayISO } from "@/lib/date";
import { Card } from "@/components/card";
import { AttendanceBoard } from "./attendance-board";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requirePageSession();
  const { date: rawDate } = await searchParams;
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayISO();

  const batch = await getCurrentBatch();
  if (!batch) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No current batch is set.</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          An admin needs to create a batch and mark it current first.
        </p>
      </Card>
    );
  }

  const [records, allStudents] = await Promise.all([
    getAttendanceDay(batch.id, date),
    listStudents(batch.id),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading attendance board…</div>}>
      <AttendanceBoard
        key={date}
        batchName={batch.name}
        date={date}
        initialRecords={records}
        allStudents={allStudents}
      />
    </Suspense>
  );
}
