"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil, Sparkles, Loader2, CalendarPlus, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import type { Student } from "@/lib/db/queries/students";
import type { Batch } from "@/lib/db/queries/batches";
import type { StudentSummary } from "@/lib/attendance/summary";
import type { AttendanceRecord } from "@/lib/db/queries/attendance";
import type { Leave } from "@/lib/db/queries/leaves";

interface StudentHistoryData {
  student: Student;
  batch: Batch;
  summary: StudentSummary;
  records: AttendanceRecord[];
  leaves: Leave[];
}

interface StudentDrawerProps {
  studentId: number | null;
  onClose: () => void;
  onEditStudent?: (student: Student) => void;
}

export function StudentDrawer({ studentId, onClose, onEditStudent }: StudentDrawerProps) {
  const [data, setData] = useState<StudentHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "leaves" | "info">("timeline");

  // Approve leave inline state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  const fetchHistory = useCallback((id: number) => {
    setLoading(true);
    setError(null);

    fetch(`/api/students/${id}/history`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load intern history");
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        setError(err.message ?? "Error fetching details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!studentId) {
      return;
    }

    queueMicrotask(() => {
      fetchHistory(studentId);
    });
  }, [studentId, fetchHistory]);

  async function handleApproveLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!data || leaveSubmitting) return;

    if (!leaveStartDate || !leaveEndDate) {
      setLeaveError("Please select both Start Date and End Date.");
      return;
    }

    if (leaveStartDate > leaveEndDate) {
      setLeaveError("Start date cannot be after end date.");
      return;
    }

    setLeaveSubmitting(true);
    setLeaveError(null);
    setLeaveSuccess(null);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: data.student.rollNumber,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setLeaveError(result.error ?? "Failed to approve leave");
        return;
      }

      setLeaveSuccess("Approved leave recorded successfully.");
      setShowLeaveForm(false);
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      fetchHistory(data.student.id);
    } catch {
      setLeaveError("Network error — try again.");
    } finally {
      setLeaveSubmitting(false);
    }
  }

  const isOpen = studentId !== null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-neutral-200/90 bg-white p-0 shadow-2xl outline-none duration-200 animate-in slide-in-from-right dark:border-neutral-800 dark:bg-neutral-900">
          {/* Header */}
          <div className="relative border-b border-neutral-200/80 bg-neutral-50/60 p-6 dark:border-neutral-800 dark:bg-neutral-900/80">
            <Dialog.Close asChild>
              <button
                aria-label="Close drawer"
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            {loading && !data && (
              <div className="py-2">
                <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2" />
                <div className="h-7 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-1" />
                <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 p-4 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {data && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono rounded-md bg-[#9E1B32]/10 px-2.5 py-0.5 text-xs font-semibold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
                    Roll #{data.student.rollNumber}
                  </span>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {data.batch.name}
                  </span>
                </div>
                <Dialog.Title className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {data.student.name}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Posting: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{data.student.postingPeriod}</strong>
                </Dialog.Description>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLeaveError(null);
                      setLeaveSuccess(null);
                      setShowLeaveForm((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    {showLeaveForm ? "Cancel Leave" : "+ Record Leave"}
                  </button>

                  {onEditStudent && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditStudent(data.student);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Record
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Inline Approve Leave Form */}
          {data && showLeaveForm && (
            <form onSubmit={handleApproveLeave} className="border-b border-neutral-200/80 bg-blue-50/40 p-4 dark:border-neutral-800 dark:bg-blue-950/20">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 mb-2">
                <CalendarPlus className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
                Record Approved Leave for {data.student.name}
              </h4>

              {leaveError && (
                <p className="mb-2 text-xs text-red-600 dark:text-red-400 font-medium">{leaveError}</p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    End Date
                  </label>
                  <input
                    required
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Reason (Optional)
                </label>
                <input
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Medical leave or family emergency"
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={leaveSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {leaveSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recording Leave…
                  </>
                ) : (
                  "Confirm & Save Leave"
                )}
              </button>
            </form>
          )}

          {leaveSuccess && (
            <div className="bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {leaveSuccess}
            </div>
          )}

          {/* Metrics summary */}
          {data && !loading && (
            <div className="grid grid-cols-4 border-b border-neutral-200/80 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-r border-neutral-100 dark:border-neutral-800/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Absences
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-red-600 dark:text-red-400">
                  {data.summary.absenceCount}
                </p>
              </div>
              <div className="border-r border-neutral-100 dark:border-neutral-800/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Late
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {data.summary.lateCount}
                </p>
              </div>
              <div className="border-r border-neutral-100 dark:border-neutral-800/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Leaves
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {data.summary.leaveDays}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Total Off
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {data.summary.absentDays}d
                </p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          {data && !loading && (
            <div className="flex border-b border-neutral-200/80 px-6 text-sm dark:border-neutral-800">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`border-b-2 px-3 py-3 font-semibold transition-colors ${
                  activeTab === "timeline"
                    ? "border-[#9E1B32] text-[#9E1B32] dark:border-[#e8a3b0] dark:text-[#e8a3b0]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                Attendance Log ({data.records.length})
              </button>
              <button
                onClick={() => setActiveTab("leaves")}
                className={`border-b-2 px-3 py-3 font-semibold transition-colors ${
                  activeTab === "leaves"
                    ? "border-[#9E1B32] text-[#9E1B32] dark:border-[#e8a3b0] dark:text-[#e8a3b0]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                Approved Leaves ({data.leaves.length})
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`border-b-2 px-3 py-3 font-semibold transition-colors ${
                  activeTab === "info"
                    ? "border-[#9E1B32] text-[#9E1B32] dark:border-[#e8a3b0] dark:text-[#e8a3b0]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                Profile & Notes
              </button>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && !data && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#9E1B32] dark:text-[#e8a3b0] mb-3" />
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Fetching Intern History...
                </p>
              </div>
            )}

            {data && activeTab === "timeline" && (
              <div>
                {data.records.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200/80 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-2">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      100% Perfect Attendance Record
                    </p>
                    <p className="mt-1 text-xs">No absences or late logs recorded for this intern.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-neutral-200/80 pl-5 dark:border-neutral-800 space-y-4">
                    {data.records.map((r) => (
                      <div key={r.id} className="relative">
                        <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#9E1B32] dark:border-neutral-900 dark:bg-[#e8a3b0]" />
                        <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200/60 bg-white p-3.5 shadow-2xs dark:border-neutral-800/80 dark:bg-neutral-800/40">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {formatDate(r.date)}
                            </p>
                            {r.remarks && (
                              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                &quot;{r.remarks}&quot;
                              </p>
                            )}
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {data && activeTab === "leaves" && (
              <div className="space-y-3">
                {data.leaves.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200/80 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    No approved leave applications recorded.
                  </div>
                ) : (
                  data.leaves.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-lg border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Leave Range
                        </span>
                        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                          {formatDate(l.startDate)} – {formatDate(l.endDate)}
                        </span>
                      </div>
                      {l.reason ? (
                        <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">
                          <strong>Reason:</strong> {l.reason}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs italic text-neutral-400">
                          No reason specified
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {data && activeTab === "info" && (
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Posting Information
                  </h4>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-neutral-400 font-medium">Posting Period</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-800 dark:text-neutral-200">
                        {data.student.postingPeriod}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-400 font-medium">Batch</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-800 dark:text-neutral-200">
                        {data.batch.name}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Remarks & Notes
                  </h4>
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {data.student.remarks || "No additional remarks recorded for this intern."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
