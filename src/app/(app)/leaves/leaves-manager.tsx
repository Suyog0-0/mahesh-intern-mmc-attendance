"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leaves</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {batchName}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
        >
          + Record leave
        </button>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">
          All leaves ({leaves.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th className="pb-2 pr-3">Student</th>
                <th className="pb-2 pr-3">Dates</th>
                <th className="pb-2 pr-3">Reason</th>
                <th className="pb-2 pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3">
                    <span className="text-neutral-400">{l.rollNumber}</span>{" "}
                    {l.name}
                  </td>
                  <td className="py-2 pr-3 text-neutral-500 dark:text-neutral-400">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </td>
                  <td className="py-2 pr-3">{l.reason ?? "—"}</td>
                  <td className="py-2 pr-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(l)}
                      className="text-xs font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400"
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
                    className="py-6 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    No leaves recorded yet.
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
        title="Record a leave"
        description="Every day in this range counts as a leave day for the student unless attendance is separately marked for that date."
      >
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <form onSubmit={submit} className="grid gap-3">
          <label className="block text-sm font-medium">
            Roll number
            <input
              required
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium">
            Reason (optional)
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium">
            Start date
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium">
            End date
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
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {pending ? "Saving…" : "Add leave"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
            >
              Cancel
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete leave record?"
        description={
          deleteTarget
            ? `This removes the leave for ${deleteTarget.name} (${deleteTarget.rollNumber}), ${formatDate(deleteTarget.startDate)} – ${formatDate(deleteTarget.endDate)}.`
            : undefined
        }
      >
        <Modal.Footer>
          <button
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700";
