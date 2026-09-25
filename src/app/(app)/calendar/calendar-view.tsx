"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { bsDateToISO, bsMonthDayCount, bsWeekdayOfMonth, formatDate, formatMonth, shiftMonth, todayISO } from "@/lib/date";
import type { DailySummary } from "@/lib/attendance/summary";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  batchName,
  month,
  days,
}: {
  batchName: string;
  month: string;
  days: DailySummary[];
}) {
  const router = useRouter();
  const [bsYear, bsMonth] = month.split("-").map(Number);
  const monthDays = bsMonthDayCount(month);
  const leadingBlanks = bsWeekdayOfMonth(month);
  const cellCount = Math.ceil((leadingBlanks + monthDays) / 7) * 7;
  const today = todayISO();
  const dailyByDate = new Map(days.map((day) => [day.date, day]));

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-5 sm:gap-6">
      <header className="flex min-w-0 flex-col gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">
            <CalendarDays className="h-5 w-5 shrink-0 text-[#1E4F91] dark:text-[#A9C5EA]" />
            <span>Attendance Calendar</span>
          </h1>
          <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {batchName}
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900 sm:w-auto sm:justify-start">
          <button
            type="button"
            onClick={() => router.push(`/calendar?month=${shiftMonth(month, -1)}`)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span aria-live="polite" className="min-w-0 flex-1 px-2 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:min-w-36">
            {formatMonth(month)}
          </span>
          <button
            type="button"
            onClick={() => router.push(`/calendar?month=${shiftMonth(month, 1)}`)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section aria-label={`${formatMonth(month)} attendance`} className="min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="calendar-grid grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="calendar-weekday py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
              <span className="sm:hidden">{weekday.slice(0, 1)}</span>
              <span className="hidden sm:inline">{weekday}</span>
            </div>
          ))}
        </div>

        <div className="calendar-grid grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-800">
          {Array.from({ length: cellCount }, (_, index) => {
            const dayNumber = index - leadingBlanks + 1;
            if (dayNumber < 1 || dayNumber > monthDays) {
              return <div key={`blank-${index}`} aria-hidden="true" className="calendar-cell bg-neutral-50/70 dark:bg-neutral-900/60 sm:min-h-24" />;
            }

            const date = bsDateToISO(bsYear, bsMonth - 1, dayNumber);
            const day = dailyByDate.get(date);
            if (!day) return <div key={date} aria-hidden="true" className="calendar-cell bg-neutral-50/70 dark:bg-neutral-900/60 sm:min-h-24" />;
            const isToday = date === today;
            const issues = [
              day.absent > 0 ? `${day.absent} absent` : "",
              day.late > 0 ? `${day.late} late` : "",
              day.leave > 0 ? `${day.leave} on leave` : "",
            ].filter(Boolean);
            const accessibleSummary = issues.length ? issues.join(", ") : `${day.present} present`;

            return (
              <Link
                key={date}
                href={`/attendance?date=${date}`}
                aria-label={`${formatDate(date)}: ${accessibleSummary}. Open attendance.`}
                className="calendar-cell group flex min-h-14 min-w-0 flex-col items-center bg-white text-center transition-colors hover:bg-neutral-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1E4F91] dark:bg-neutral-900 dark:hover:bg-neutral-800/70 sm:min-h-24 sm:items-stretch sm:p-2 sm:text-left lg:min-h-32 lg:p-3"
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${isToday ? "bg-[#1E4F91] text-white" : "text-neutral-700 group-hover:text-[#1E4F91] dark:text-neutral-300 dark:group-hover:text-[#A9C5EA]"}`}>
                  {dayNumber}
                </span>

                <div className="mt-auto hidden w-full flex-col gap-1 pt-2 lg:flex">
                  {day.absent > 0 && <IssueCount tone="red" count={day.absent} label="Absent" />}
                  {day.late > 0 && <IssueCount tone="amber" count={day.late} label="Late" />}
                  {day.leave > 0 && <IssueCount tone="blue" count={day.leave} label="Leave" />}
                  {issues.length === 0 && day.present > 0 && <span className="text-[10px] text-emerald-700 dark:text-emerald-400">No exceptions</span>}
                </div>

                <div aria-hidden="true" className="mt-1 flex min-h-1.5 items-center justify-center gap-1 lg:hidden">
                  {day.absent > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                  {day.late > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  {day.leave > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </div>
                <span className="sr-only">{accessibleSummary}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div aria-label="Calendar legend" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-600 dark:text-neutral-400 sm:justify-start">
        <LegendDot color="bg-red-500" label="Absent" />
        <LegendDot color="bg-amber-500" label="Late" />
        <LegendDot color="bg-blue-500" label="On leave" />
        <span className="text-neutral-400">Select a day to open attendance</span>
      </div>
    </div>
  );
}

function IssueCount({
  tone,
  count,
  label,
}: {
  tone: "red" | "amber" | "blue";
  count: number;
  label: string;
}) {
  const toneClasses = {
    red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  };
  return <span className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold ${toneClasses[tone]}`}>{count} {label}</span>;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
