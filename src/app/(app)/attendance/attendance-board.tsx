"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import type { DayListRow } from "@/lib/attendance/service";

type Status = "absent" | "late" | "leave";
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "leave", label: "Leave" },
];

interface Props {
  batchName: string;
  date: string;
  initialRecords: DayListRow[];
}

export function AttendanceBoard({ batchName, date, initialRecords }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roll, setRoll] = useState("");
  const [busyRoll, setBusyRoll] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState(initialRecords);
  const [confirming, setConfirming] = useState<number | null>(null);

  const markedByRoll = useMemo(
    () => new Map(records.map((r) => [r.rollNumber, r])),
    [records],
  );
  const existingForRoll = markedByRoll.get(roll.trim());

  function changeDate(newDate: string) {
    startTransition(() => router.push(`/attendance?date=${newDate}`));
  }

  async function mark(status: Status) {
    const value = roll.trim();
    if (!value || busyRoll) return;
    setError(null);
    setBusyRoll(value);
    try {
      const lookupRes = await fetch(`/api/attendance/lookup?roll=${encodeURIComponent(value)}&date=${date}`);
      const lookup = await lookupRes.json();
      if (!lookupRes.ok) {
        setError(lookup.error ?? "Student not found");
        return;
      }
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: lookup.student.id, date, status, remarks: null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not mark attendance");
        return;
      }
      setRecords((prev) => {
        const next = prev.filter((r) => r.studentId !== lookup.student.id);
        next.push({
          studentId: lookup.student.id,
          rollNumber: lookup.student.rollNumber,
          name: lookup.student.name,
          status,
          remarks: null,
          source: "record",
        });
        return next;
      });
      setRoll("");
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusyRoll(null);
    }
  }

  async function clearStudent(studentId: number) {
    setConfirming(null);
    const res = await fetch(`/api/attendance?studentId=${studentId}&date=${date}`, { method: "DELETE" });
    if (res.ok) setRecords((prev) => prev.filter((r) => r.studentId !== studentId));
  }

  const sorted = [...records].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Take Attendance</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{batchName}</p>
        </div>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => changeDate(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
        />
      </div>

      <Card className={isPending ? "opacity-60" : ""}>
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          Only mark students who are <strong>not</strong> present — everyone else is counted present automatically for {formatDate(date)}.
        </p>
        {error && (
          <div role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="Roll number"
            className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 sm:max-w-[180px] dark:border-neutral-700"
          />
          {existingForRoll && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Already marked <strong>{existingForRoll.status}</strong> — picking a status below will overwrite it.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!roll.trim() || !!busyRoll}
                onClick={() => mark(opt.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                {busyRoll ? "…" : opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Marked for {formatDate(date)} ({sorted.length})
          </h2>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Nobody marked yet — everyone is present.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {sorted.map((r) => (
              <li key={r.studentId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="text-neutral-400">{r.rollNumber}</span> {r.name}
                  {r.source === "leave" && (
                    <span className="ml-2 text-xs text-neutral-400">(from approved leave)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.source === "record" &&
                    (confirming === r.studentId ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => clearStudent(r.studentId)}
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirming(r.studentId)}
                        className="text-xs font-medium text-neutral-500 hover:text-[#9E1B32] dark:text-neutral-400"
                      >
                        Mark present
                      </button>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
