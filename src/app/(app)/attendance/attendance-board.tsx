"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
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

type StatusTarget = { id: number; rollNumber: string; name: string };

export function AttendanceBoard({ batchName, date, initialRecords }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roll, setRoll] = useState("");
  const [busyRoll, setBusyRoll] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState(initialRecords);
  const [clearTarget, setClearTarget] = useState<DayListRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [pendingMark, setPendingMark] = useState(false);

  const markedByRoll = useMemo(
    () => new Map(records.map((r) => [r.rollNumber, r])),
    [records],
  );
  const existingForRoll = markedByRoll.get(roll.trim());

  function changeDate(newDate: string) {
    startTransition(() => router.push(`/attendance?date=${newDate}`));
  }

  async function lookupAndOpen(e?: React.FormEvent) {
    e?.preventDefault();
    const value = roll.trim();
    if (!value || busyRoll) return;
    setError(null);
    setBusyRoll(value);
    try {
      const lookupRes = await fetch(
        `/api/attendance/lookup?roll=${encodeURIComponent(value)}&date=${date}`,
      );
      const lookup = await lookupRes.json();
      if (!lookupRes.ok) {
        setError(lookup.error ?? "Student not found");
        return;
      }
      setStatusTarget({
        id: lookup.student.id,
        rollNumber: lookup.student.rollNumber,
        name: lookup.student.name,
      });
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusyRoll(null);
    }
  }

  async function mark(status: Status) {
    if (!statusTarget || pendingMark) return;
    setPendingMark(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: statusTarget.id,
          date,
          status,
          remarks: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not mark attendance");
        return;
      }
      setRecords((prev) => {
        const next = prev.filter((r) => r.studentId !== statusTarget.id);
        next.push({
          studentId: statusTarget.id,
          rollNumber: statusTarget.rollNumber,
          name: statusTarget.name,
          status,
          remarks: null,
          source: "record",
        });
        return next;
      });
      setRoll("");
      setStatusTarget(null);
    } catch {
      setError("Network error — try again.");
    } finally {
      setPendingMark(false);
    }
  }

  async function confirmClear() {
    if (!clearTarget) return;
    const studentId = clearTarget.studentId;
    setClearTarget(null);
    const res = await fetch(
      `/api/attendance?studentId=${studentId}&date=${date}`,
      { method: "DELETE" },
    );
    if (res.ok)
      setRecords((prev) => prev.filter((r) => r.studentId !== studentId));
  }

  const sorted = [...records].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Take Attendance</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {batchName}
          </p>
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
          Only mark students who are <strong>not</strong> present — everyone
          else is counted present automatically for {formatDate(date)}.
        </p>
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <form
          onSubmit={lookupAndOpen}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="Roll number"
            autoFocus
            className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 sm:max-w-[180px] sm:py-2 sm:text-sm dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={!roll.trim() || !!busyRoll}
            className="rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
          >
            {busyRoll ? "Finding…" : "Find student"}
          </button>
        </form>
        {existingForRoll && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Already marked <strong>{existingForRoll.status}</strong> — finding
            again lets you change it.
          </p>
        )}
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
              <li
                key={r.studentId}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="text-neutral-400">{r.rollNumber}</span>{" "}
                  {r.name}
                  {r.source === "leave" && (
                    <span className="ml-2 text-xs text-neutral-400">
                      (from approved leave)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.source === "record" && (
                    <button
                      onClick={() => setClearTarget(r)}
                      className="text-xs font-medium text-neutral-500 hover:text-[#9E1B32] dark:text-neutral-400"
                    >
                      Mark present
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Status selection modal — opens once a student is found by roll number */}
      <Modal
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={statusTarget ? statusTarget.name : ""}
        description={
          statusTarget
            ? `Roll ${statusTarget.rollNumber} — ${formatDate(date)}`
            : undefined
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={pendingMark}
              onClick={() => mark(opt.value)}
              className="rounded-lg border border-neutral-300 px-3 py-3 text-sm font-medium transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              {pendingMark ? "…" : opt.label}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!clearTarget}
        onOpenChange={(open) => !open && setClearTarget(null)}
        title="Mark as present?"
        description={
          clearTarget
            ? `This clears the ${clearTarget.status} record for ${clearTarget.name} (${clearTarget.rollNumber}) on ${formatDate(date)}.`
            : undefined
        }
      >
        <Modal.Footer>
          <button
            onClick={confirmClear}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Confirm
          </button>
          <button
            onClick={() => setClearTarget(null)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
