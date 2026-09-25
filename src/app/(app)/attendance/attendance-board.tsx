"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { formatDate } from "@/lib/date";
import type { DayListRow } from "@/lib/attendance/service";
import type { Student } from "@/lib/db/queries/students";
import { Search, CheckCircle2, UserX, Clock, CalendarX, Plus, Loader2 } from "lucide-react";

type Status = "absent" | "late" | "leave";

const STATUS_CONFIG: {
  value: Status;
  label: string;
  icon: typeof UserX;
  colorCls: string;
}[] = [
  {
    value: "absent",
    label: "Absent",
    icon: UserX,
    colorCls:
      "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-900/40",
  },
  {
    value: "late",
    label: "Late",
    icon: Clock,
    colorCls:
      "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-900/40",
  },
  {
    value: "leave",
    label: "Leave",
    icon: CalendarX,
    colorCls:
      "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-900/40",
  },
];

interface Props {
  batchName: string;
  date: string;
  initialRecords: DayListRow[];
  allStudents?: Student[];
}

type SelectedStudent = { id: number; rollNumber: string; name: string };

export function AttendanceBoard({
  batchName,
  date,
  initialRecords,
  allStudents = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoOpen = searchParams.get("openModal") === "true";

  const { openStudent } = useStudentDrawer();
  const [isPending, startTransition] = useTransition();

  const [takeModalOpen, setTakeModalOpen] = useState(shouldAutoOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [activeStatusMarking, setActiveStatusMarking] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [records, setRecords] = useState(initialRecords);
  const [clearTarget, setClearTarget] = useState<DayListRow | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const markedByStudentId = useMemo(
    () => new Map(records.map((r) => [r.studentId, r])),
    [records],
  );

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allStudents
      .filter(
        (s) =>
          s.rollNumber.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [allStudents, searchQuery]);

  function changeDate(newDate: string) {
    startTransition(() => router.push(`/attendance?date=${newDate}`));
  }

  function handleSelectStudent(student: SelectedStudent) {
    setSelectedStudent(student);
    setError(null);
  }

  async function mark(status: Status) {
    if (!selectedStudent || activeStatusMarking) return;
    setActiveStatusMarking(status);
    setError(null);

    const targetStudent = selectedStudent;
    const previousRecords = [...records];

    setRecords((prev) => {
      const next = prev.filter((r) => r.studentId !== targetStudent.id);
      next.push({
        studentId: targetStudent.id,
        rollNumber: targetStudent.rollNumber,
        name: targetStudent.name,
        status,
        remarks: null,
        source: "record",
      });
      return next;
    });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: targetStudent.id,
          date,
          status,
          remarks: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecords(previousRecords);
        setError(data.error ?? "Could not record status");
        return;
      }
      setSelectedStudent(null);
      setSearchQuery("");
    } catch {
      setRecords(previousRecords);
      setError("Network error — please try again.");
    } finally {
      setActiveStatusMarking(null);
    }
  }

  async function confirmClear() {
    if (!clearTarget || isClearing) return;
    const studentId = clearTarget.studentId;
    setIsClearing(true);

    const previousRecords = [...records];
    setRecords((prev) => prev.filter((r) => r.studentId !== studentId));

    try {
      const res = await fetch(
        `/api/attendance?studentId=${studentId}&date=${date}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setRecords(previousRecords);
        setError("Could not clear attendance");
      } else {
        setClearTarget(null);
      }
    } catch {
      setRecords(previousRecords);
      setError("Network error — please try again.");
    } finally {
      setIsClearing(false);
    }
  }

  const sortedRecords = [...records].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Attendance Log
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Batch: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{batchName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => changeDate(e.target.value)}
            className="rounded-lg border border-neutral-300/80 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-200"
          />

          <button
            type="button"
            onClick={() => {
              setError(null);
              setSelectedStudent(null);
              setSearchQuery("");
              setTakeModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
          >
            <Plus className="h-4 w-4" />
            <span>Take Attendance</span>
          </button>
        </div>
      </div>

      {/* Main Records Container */}
      <Card className={isPending ? "opacity-60 transition-opacity" : ""}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Recorded Exceptions ({sortedRecords.length})
          </h2>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {formatDate(date)}
          </span>
        </div>

        {sortedRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200/80 p-8 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              All Interns Present
            </p>
            <p className="mt-1">No absences or leaves logged for this date.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/60 rounded-xl border border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {sortedRecords.map((r) => (
              <li
                key={r.studentId}
                onClick={() => openStudent(r.studentId)}
                className="group flex cursor-pointer items-center justify-between gap-3 p-4 text-xs transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openStudent(r.studentId);
                  }
                }}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#9E1B32] group-hover:underline dark:text-[#e8a3b0]">
                    #{r.rollNumber}
                  </span>
                  <span className="font-semibold text-neutral-900 group-hover:text-[#9E1B32] dark:text-neutral-100 dark:group-hover:text-[#e8a3b0]">
                    {r.name}
                  </span>
                  {r.source === "leave" && (
                    <span className="text-[11px] italic text-neutral-400">
                      (Approved Leave)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  {r.source === "record" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClearTarget(r);
                      }}
                      className="font-semibold text-neutral-400 transition-colors hover:text-[#9E1B32] dark:hover:text-[#e8a3b0]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Take Attendance Modal */}
      <Modal
        open={takeModalOpen}
        onOpenChange={setTakeModalOpen}
        title="Take Attendance"
        description={`Record attendance exceptions for ${formatDate(date)}`}
      >
        <div className="flex flex-col gap-4 py-2">
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {!selectedStudent ? (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search intern by roll number or name..."
                  className="w-full rounded-xl border border-neutral-300/80 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
                  autoFocus
                />
              </div>

              {searchSuggestions.length > 0 && (
                <ul className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-neutral-200/90 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700/60">
                  {searchSuggestions.map((s) => {
                    const marked = markedByStudentId.get(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectStudent(s)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/60"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[#9E1B32] dark:text-[#e8a3b0]">
                              #{s.rollNumber}
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {s.name}
                            </span>
                          </div>
                          {marked ? (
                            <StatusBadge status={marked.status} />
                          ) : (
                            <span className="text-[11px] font-semibold text-[#9E1B32] dark:text-[#e8a3b0]">
                              Mark →
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {searchQuery.trim() !== "" && searchSuggestions.length === 0 && (
                <p className="mt-4 text-center text-xs text-neutral-500">
                  No matching intern found.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                <div>
                  <span className="font-mono text-xs font-bold text-[#9E1B32] dark:text-[#e8a3b0]">
                    Roll #{selectedStudent.rollNumber}
                  </span>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-sm mt-0.5">
                    {selectedStudent.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {STATUS_CONFIG.map((opt) => {
                  const isLoadingThis = activeStatusMarking === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!!activeStatusMarking}
                      onClick={() => mark(opt.value)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all ${opt.colorCls} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                      <span>{isLoadingThis ? "Saving..." : opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Modal.Footer>
            <button
              type="button"
              onClick={() => setTakeModalOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Done
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        open={!!clearTarget}
        onOpenChange={(open) => !open && setClearTarget(null)}
        title="Mark Intern as Present?"
        description={
          clearTarget
            ? `This removes the logged ${clearTarget.status} record for ${clearTarget.name} (Roll #${clearTarget.rollNumber}) on ${formatDate(date)}.`
            : undefined
        }
      >
        <Modal.Footer>
          <button
            type="button"
            onClick={() => setClearTarget(null)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isClearing}
            onClick={confirmClear}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isClearing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Clearing…
              </>
            ) : (
              "Confirm Present"
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
