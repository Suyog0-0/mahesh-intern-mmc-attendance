import { requirePageSession } from "@/lib/auth/page-guards";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { getCalendarMonth } from "@/lib/attendance/service";
import { isMonthString, todayISO } from "@/lib/date";
import { Card } from "@/components/card";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requirePageSession();
  const { month: rawMonth } = await searchParams;
  const month = isMonthString(rawMonth) ? rawMonth : todayISO().slice(0, 7);

  const batch = await getCurrentBatch();
  if (!batch) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No current batch is set.</p>
      </Card>
    );
  }

  const days = await getCalendarMonth(batch, month);
  return <CalendarView batchName={batch.name} month={month} days={days} />;
}
