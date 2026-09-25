"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import NepaliDate, { dateConfigMap } from "nepali-date-converter";
import { bsDateToISO, bsMonthDayCount, isISODate } from "@/lib/date";

interface DateParts {
  year: string;
  month: string;
  day: string;
}

interface NepaliDateInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  disabled?: boolean;
  max?: string;
  min?: string;
  required?: boolean;
}

const EMPTY_PARTS: DateParts = { year: "", month: "", day: "" };
const YEARS = Object.keys(dateConfigMap).map(Number).sort((a, b) => a - b);

function partsFromISO(value: string): DateParts {
  if (!isISODate(value)) return EMPTY_PARTS;
  const bsDate = new NepaliDate(new Date(`${value}T00:00:00Z`));
  return {
    year: String(bsDate.getYear()),
    month: String(bsDate.getMonth() + 1),
    day: String(bsDate.getDate()),
  };
}

export function NepaliDateInput({
  value,
  onChange,
  className = "",
  disabled = false,
  max,
  min,
  required = false,
}: NepaliDateInputProps) {
  const [selection, setSelection] = useState(() => ({ value, parts: partsFromISO(value) }));
  const parts = selection.value === value ? selection.parts : partsFromISO(value);

  function updatePart(key: keyof DateParts, nextValue: string) {
    const next = { ...parts, [key]: nextValue };
    if ((key === "year" || key === "month") && next.year && next.month && next.day) {
      const lastDay = bsMonthDayCount(`${next.year}-${next.month.padStart(2, "0")}`);
      next.day = String(Math.min(Number(next.day), lastDay));
    }
    if (next.year && next.month && next.day) {
      const isoDate = bsDateToISO(Number(next.year), Number(next.month) - 1, Number(next.day));
      if ((min && isoDate < min) || (max && isoDate > max)) return;
      setSelection({ value, parts: next });
      onChange(isoDate);
      return;
    }
    setSelection({ value, parts: next });
  }

  const monthCount = parts.year && parts.month
    ? bsMonthDayCount(`${parts.year}-${parts.month.padStart(2, "0")}`)
    : 32;
  const controlClass = "h-9 min-w-0 rounded-md border-0 bg-transparent px-1.5 text-xs font-medium text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1E4F91] disabled:opacity-50 dark:text-neutral-100";

  return (
    <div className={`flex min-h-10 min-w-0 items-center gap-1 rounded-lg border border-neutral-300/80 bg-white px-2 shadow-xs transition-colors focus-within:border-[#1E4F91] dark:border-neutral-700/80 dark:bg-neutral-900 ${className}`}>
      <CalendarDays className="ml-1 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
      <select aria-label="Bikram Sambat day" required={required} disabled={disabled} value={parts.day} onChange={(event) => updatePart("day", event.target.value)} className={`${controlClass} flex-[0.75]`}>
        <option value="">DD</option>
        {Array.from({ length: monthCount }, (_, index) => index + 1).map((day) => <option key={day} value={String(day)}>{String(day).padStart(2, "0")}</option>)}
      </select>
      <select aria-label="Bikram Sambat month" required={required} disabled={disabled} value={parts.month} onChange={(event) => updatePart("month", event.target.value)} className={`${controlClass} flex-[0.7]`}>
        <option value="">MM</option>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={String(month)}>{String(month).padStart(2, "0")}</option>)}
      </select>
      <select aria-label="Bikram Sambat year" required={required} disabled={disabled} value={parts.year} onChange={(event) => updatePart("year", event.target.value)} className={`${controlClass} flex-1`}>
        <option value="">YYYY</option>
        {YEARS.map((year) => <option key={year} value={String(year)}>{year}</option>)}
      </select>
      <span aria-hidden="true" className="mr-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">BS</span>
      {value && <button type="button" disabled={disabled} onClick={() => { setSelection({ value: "", parts: EMPTY_PARTS }); onChange(""); }} aria-label="Clear date" className="mr-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:hover:bg-neutral-800 dark:hover:text-neutral-200"><X className="h-3.5 w-3.5" /></button>}
    </div>
  );
}
