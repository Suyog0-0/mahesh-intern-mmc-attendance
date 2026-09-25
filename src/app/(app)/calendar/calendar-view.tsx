"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/card";
import { formatMonth, shiftMonth, weekdayOf } from "@/lib/date";
import type { DailySummary } from "@/lib/attendance/summary";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ batchName, month, days }: { batchName: string; month: string; days: DailySummary[] }) {
  const router = useRouter();
  const byDate = new Map(days.map((d) => [d.date, d]));
  const leadingBlanks = days.length ? weekdayOf(days[0].date) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Calendar</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{batchName}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <button onClick={() => router.push(`/calendar?month=${shiftMonth(month, -1)}`)} className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700">
            ←
          </button>
          <span className="w-36 text-center">{formatMonth(month)}</span>
          <button onClick={() => router.push(`/calendar?month=${shiftMonth(month, 1)}`)} className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700">
            →
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((d) => {
            const day = byDate.get(d.date)!;
            const hasIssues = day.absent + day.late + day.leave > 0;
            return (
              <Link
                key={d.date}
                href={`/attendance?date=${d.date}`}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-neutral-100 p-1 text-xs transition-colors hover:border-[#9E1B32]/40 dark:border-neutral-900"
              >
                <span className="font-medium">{Number(d.date.slice(-2))}</span>
                {hasIssues && (
                  <span className="mt-0.5 flex gap-0.5">
                    {day.absent > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" title={`${day.absent} absent`} />}
                    {day.late > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={`${day.late} late`} />}
                    {day.leave > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title={`${day.leave} leave`} />}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Absent</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Late</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Leave</span>
        </div>
      </Card>
    </div>
  );
}
