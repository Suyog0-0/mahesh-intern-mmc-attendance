// Persistence and APIs use ISO Gregorian dates. User-facing dates and the
// calendar use Bikram Sambat; today is evaluated in Nepal time.

import NepaliDate, { dateConfigMap } from "nepali-date-converter";

export const APP_TIME_ZONE = "Asia/Kathmandu";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 3660;
const BS_MONTH_KEYS = [
  "Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Aswin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
] as const;

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function minDate(a: string, b: string): string {
  return a <= b ? a : b;
}

export function maxDate(a: string, b: string): string {
  return a >= b ? a : b;
}

/** Inclusive list of dates from..to (empty if from > to). Capped for safety. */
export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to && out.length < MAX_RANGE_DAYS) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function isMonthString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2090 && Boolean(dateConfigMap[String(year)]);
}

export function monthBounds(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const bsYear = dateConfigMap[String(year)];
  const lastDay = bsYear?.[BS_MONTH_KEYS[monthNumber - 1]];
  if (!lastDay) throw new RangeError("Bikram Sambat month is outside the supported date range.");
  return {
    from: toISODate(new NepaliDate(year, monthNumber - 1, 1)),
    to: toISODate(new NepaliDate(year, monthNumber - 1, lastDay)),
  };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function toISODate(date: NepaliDate): string {
  const ad = date.getDateObject().AD;
  return `${ad.year}-${String(ad.month + 1).padStart(2, "0")}-${String(ad.date).padStart(2, "0")}`;
}

export function bsDateToISO(year: number, monthIndex: number, day: number): string {
  return toISODate(new NepaliDate(year, monthIndex, day));
}

export function bsMonthDayCount(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  const bsYear = dateConfigMap[String(year)];
  const lastDay = bsYear?.[BS_MONTH_KEYS[monthNumber - 1]];
  if (!lastDay) throw new RangeError("Bikram Sambat month is outside the supported date range.");
  return lastDay;
}

/** 0 = Sunday ... 6 = Saturday */
export function bsWeekdayOfMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new NepaliDate(year, monthNumber - 1, 1).getDay();
}

export function todayBSMonth(now: Date = new Date()): string {
  const iso = todayISO(now);
  const date = new NepaliDate(new Date(`${iso}T00:00:00Z`));
  return `${date.getYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  try {
    return new NepaliDate(new Date(`${iso}T00:00:00Z`)).format("DD/MM/YYYY", "en");
  } catch {
    return iso;
  }
}

/** Format the ISO `start to end` posting-period value as Bikram Sambat. */
export function formatPostingPeriod(period: string): string {
  const parts = period.split(/\s+to\s+|\s+–\s+/);
  if (parts.length !== 2 || !isISODate(parts[0]) || !isISODate(parts[1])) return period;
  return `${formatDate(parts[0])} – ${formatDate(parts[1])}`;
}

export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthName = BS_MONTH_KEYS[monthNumber - 1];
  return monthName && Number.isInteger(year) ? `${monthName} ${year}` : month;
}
