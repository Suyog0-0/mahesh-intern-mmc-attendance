"use client";

import { useState } from "react";
import { CalendarPlus, Trash2, CalendarX } from "lucide-react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { formatDate } from "@/lib/date";
import type { LeaveRow } from "@/lib/db/queries/leaves";

const emptyForm = { rollNumber: "", startDate: "", endDate: "", reason: "" };

export function LeavesManager({
  batchName,
  initialLeaves,
}: {
  batchName: string;
  initialLeaves: LeaveRow[];
}) {
  const { openStudent } = useStudentDrawer();
  const [leaves, setLeaves] = useState(initialLeaves);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, reason: form.reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add leave");
        return;
      }
      // Re-fetch to get the student's name/roll joined in.
      const listRes = await fetch("/api/leaves");
      const listData = await listRes.json();
      if (listRes.ok) setLeaves(listData.leaves);
      closeForm();
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    if (res.ok) setLeaves((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Approved Leaves</h1>
          <p className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Active Batch: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{batchName}</strong>
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
        >
          <CalendarPlus className="h-4 w-4" />
          Record Leave
        </button>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <CalendarX className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
            Logged Leave Applications ({leaves.length})
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Click any leave item to view complete intern profile & analytics
          </p>
        </div>

        {/* Mobile Stacked Card View (Pixel 9 Pro / Mobile screens) */}
        <div className="grid gap-3 sm:hidden">
          {leaves.map((l) => (
            <div
              key={l.id}
              onClick={() => openStudent(l.studentId)}
              className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:active:bg-neutral-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#9E1B32] dark:text-[#e8a3b0]">
                    #{l.rollNumber}
                  </span>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {l.name}
                  </span>
                </div>
                <p className="mt-1 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                  {formatDate(l.startDate)} – {formatDate(l.endDate)}
                </p>
                {l.reason && (
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Reason: {l.reason}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(l);
                }}
                aria-label="Delete leave"
                className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {leaves.length === 0 && (
            <p className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No leave records logged yet.
            </p>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Student</th>
                <th scope="col" className="px-4 py-3">Dates</th>
                <th scope="col" className="px-4 py-3">Reason</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {leaves.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => openStudent(l.studentId)}
                  className="group cursor-pointer transition-colors hover:bg-neutral-50/90 dark:hover:bg-neutral-800/40"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openStudent(l.studentId);
                    }
                  }}
                  title="Click to view full intern history"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-neutral-500 group-hover:text-[#9E1B32] dark:text-neutral-400 dark:group-hover:text-[#e8a3b0]">
                      #{l.rollNumber}
                    </span>{" "}
                    <span className="font-semibold text-neutral-900 group-hover:text-[#9E1B32] dark:text-neutral-100 dark:group-hover:text-[#e8a3b0]">
                      {l.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 font-mono dark:text-neutral-400">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{l.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(l);
                      }}
                      className="font-semibold text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    No leave records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}
        title="Record Approved Leave"
        description="Every day in this range counts as a leave day for the student unless attendance is separately marked for that date."
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <form onSubmit={submit} className="grid gap-3.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Roll Number
            <input
              required
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Reason (Optional)
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Start Date
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            End Date
            <input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <Modal.Footer>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {pending ? "Saving…" : "Add Leave"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Leave Record?"
        description={
          deleteTarget
            ? `This removes the leave for ${deleteTarget.name} (Roll #${deleteTarget.rollNumber}), ${formatDate(deleteTarget.startDate)} – ${formatDate(deleteTarget.endDate)}.`
            : undefined
        }
      >
        <Modal.Footer>
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Delete Permanently
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300/80 bg-white px-3.5 py-2 text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
