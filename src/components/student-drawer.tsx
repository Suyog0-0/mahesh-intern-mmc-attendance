"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil, Loader2, CalendarPlus, CheckCircle2, Download, RotateCw, CalendarDays } from "lucide-react";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";
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
  const { toast } = useToast();
  const [data, setData] = useState<StudentHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "leaves" | "info">("timeline");
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Leave form state
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const fetchHistory = useCallback(async (id: number, signal?: AbortSignal, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await fetch(`/api/students/${id}/history`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load this intern's history.");
      if (!signal?.aborted) setData(result as StudentHistoryData);
    } catch (cause) {
      if (!signal?.aborted) {
        setError(cause instanceof Error ? cause.message : "Could not load intern details.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId === null) return;
    const controller = new AbortController();
    queueMicrotask(() => void fetchHistory(studentId, controller.signal));
    return () => controller.abort();
  }, [studentId, fetchHistory]);

  const visibleData = data?.student.id === studentId ? data : null;

  function openLeaveForm() {
    setLeaveError(null);
    setLeaveStartDate("");
    setLeaveEndDate("");
    setLeaveReason("");
    setIsLeaveModalOpen(true);
  }

  function closeLeaveForm() {
    setIsLeaveModalOpen(false);
    setLeaveError(null);
  }

  function downloadCSV() {
    if (!visibleData) return;
    
    const headers = ["Date", "Status", "Remarks"];
    const rows = visibleData.records.map((r) => [
      formatDate(r.date),
      r.status,
      `"${r.remarks || ""}"`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${visibleData.student.name.replace(/\s+/g, "_")}_Attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleApproveLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!visibleData || leaveSubmitting) return;

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

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: visibleData.student.rollNumber,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setLeaveError(result.error ?? "Failed to record leave");
        return;
      }

      closeLeaveForm();
      toast({ tone: "success", title: "Leave recorded", description: `${visibleData.student.name} · ${formatDate(leaveStartDate)} – ${formatDate(leaveEndDate)}` });
      void fetchHistory(visibleData.student.id, undefined, false);
    } catch {
      setLeaveError("Network error — try again.");
    } finally {
      setLeaveSubmitting(false);
    }
  }

  const isOpen = studentId !== null;

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-neutral-200/90 bg-white p-0 shadow-2xl outline-none duration-200 animate-in slide-in-from-right dark:border-neutral-800 dark:bg-neutral-900">
            {/* Header */}
            <div className="relative border-b border-neutral-200/80 bg-neutral-50/60 p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900/80">
              <Dialog.Close asChild>
                <button
                  aria-label="Close intern details"
                  title="Close"
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>

              {loading && !visibleData && (
                <div className="py-2">
                  <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2" />
                  <div className="h-7 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-1" />
                  <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
              )}

              {visibleData && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono rounded-md bg-[#9E1B32]/10 px-2.5 py-0.5 text-xs font-semibold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
                      Roll #{visibleData.student.rollNumber}
                    </span>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {visibleData.batch.name}
                    </span>
                  </div>
                  <Dialog.Title className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    {visibleData.student.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Posting: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{visibleData.student.postingPeriod}</strong>
                  </Dialog.Description>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={openLeaveForm}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Record Leave
                    </button>

                    {onEditStudent && (
                      <button
                        onClick={() => {
                          onClose();
                          onEditStudent(visibleData.student);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Record
                      </button>
                    )}
                    <button
                      onClick={downloadCSV}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics summary */}
            {visibleData && !loading && (
              <div className="grid grid-cols-4 divide-x divide-neutral-100 border-b border-neutral-200/80 bg-white px-2 py-4 text-center dark:divide-neutral-800/60 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="px-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400 sm:text-[10px]">
                    Absences
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-red-600 dark:text-red-400">
                    {visibleData.summary.absenceCount}
                  </p>
                </div>
                <div className="px-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400 sm:text-[10px]">
                    Late
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-amber-600 dark:text-amber-400">
                    {visibleData.summary.lateCount}
                  </p>
                </div>
                <div className="px-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400 sm:text-[10px]">
                    Leaves
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-blue-600 dark:text-blue-400">
                    {visibleData.summary.leaveDays}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400 sm:text-[10px]">
                    Total Off
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50">
                    {visibleData.summary.absentDays}d
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            {visibleData && !loading && (
              <div className="flex overflow-x-auto border-b border-neutral-200/80 px-3 text-xs sm:px-6 dark:border-neutral-800">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`shrink-0 border-b-2 px-3 py-3 font-semibold transition-colors ${
                    activeTab === "timeline"
                      ? "border-[#9E1B32] text-[#9E1B32] dark:border-[#e8a3b0] dark:text-[#e8a3b0]"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                  }`}
                >
                  Attendance Log ({visibleData.records.length})
                </button>
                <button
                  onClick={() => setActiveTab("leaves")}
                  className={`shrink-0 border-b-2 px-3 py-3 font-semibold transition-colors ${
                    activeTab === "leaves"
                      ? "border-[#9E1B32] text-[#9E1B32] dark:border-[#e8a3b0] dark:text-[#e8a3b0]"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                  }`}
                >
                  Leaves ({visibleData.leaves.length})
                </button>
                <button
                  onClick={() => setActiveTab("info")}
                  className={`shrink-0 border-b-2 px-3 py-3 font-semibold transition-colors ${
                    activeTab === "info"
                      ? "border-[#9E1B32] text-[#9E1B32] dark:border-[#e8a3b0] dark:text-[#e8a3b0]"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                  }`}
                >
                  Profile &amp; Notes
                </button>
              </div>
            )}

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading && !visibleData && (
                <div role="status" aria-label="Loading intern history" className="animate-pulse space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#9E1B32]" />Loading history</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => <div key={item} className="h-20 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />)}
                  </div>
                  <div className="space-y-3">
                    {[0, 1, 2].map((item) => <div key={item} className="h-[4.5rem] rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" />)}
                  </div>
                </div>
              )}

              {!loading && error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50/70 p-5 dark:border-red-900/60 dark:bg-red-950/20">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-200">History couldn’t be loaded</p>
                  <p className="mt-1 text-xs leading-5 text-red-800/80 dark:text-red-300">{error}</p>
                  <button type="button" onClick={() => studentId !== null && void fetchHistory(studentId)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-800 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:border-red-900 dark:bg-neutral-900 dark:text-red-200 dark:hover:bg-red-950/40">
                    <RotateCw className="h-3.5 w-3.5" /> Try again
                  </button>
                </div>
              )}

              {visibleData && activeTab === "timeline" && (
                <div>
                  {visibleData.records.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200/80 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                        No exceptions recorded
                      </p>
                      <p className="mt-1 text-xs">There are no absence or late records for this intern.</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-neutral-200/80 pl-5 dark:border-neutral-800 space-y-4">
                      {visibleData.records.map((r) => (
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

              {visibleData && activeTab === "leaves" && (
                <div className="space-y-3">
                  {visibleData.leaves.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200/80 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      No leave applications recorded.
                    </div>
                  ) : (
                    visibleData.leaves.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-lg border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                            <CalendarDays className="h-3.5 w-3.5" /> Leave
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

              {visibleData && activeTab === "info" && (
                <div className="space-y-4 text-sm">
                  <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Posting Information
                    </h4>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-neutral-400 font-medium">Posting Period</dt>
                        <dd className="mt-0.5 font-semibold text-neutral-800 dark:text-neutral-200">
                          {visibleData.student.postingPeriod}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400 font-medium">Batch</dt>
                        <dd className="mt-0.5 font-semibold text-neutral-800 dark:text-neutral-200">
                          {visibleData.batch.name}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Remarks &amp; Notes
                    </h4>
                    <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {visibleData.student.remarks || "No additional remarks recorded for this intern."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Record Leave Modal (Nested outside Dialog.Portal to render properly as a separate Modal context) */}
      <Modal
        open={isLeaveModalOpen}
        onOpenChange={(open) => (open ? setIsLeaveModalOpen(true) : closeLeaveForm())}
        title="Record Leave"
        description="Every day in this range counts as a leave day for the student unless attendance is separately marked for that date."
      >
        {leaveError && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {leaveError}
          </div>
        )}
        <form onSubmit={handleApproveLeave} className="grid gap-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Start Date
              <input
                required
                type="date"
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              End Date
              <input
                required
                type="date"
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Reason <span className="font-normal text-neutral-400">(Optional)</span>
            <input
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Medical leave"
              className={inputCls}
            />
          </label>
          <Modal.Footer>
            <button
              type="button"
              onClick={closeLeaveForm}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={leaveSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {leaveSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Recording…
                </>
              ) : (
                "Record Leave"
              )}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
