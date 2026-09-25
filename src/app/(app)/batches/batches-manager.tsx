"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { formatDate } from "@/lib/date";
import type { Batch } from "@/lib/db/queries/batches";
import { Plus, FolderKanban, Calendar, Users, CheckCircle2, Loader2 } from "lucide-react";

type BatchRow = Batch & { studentCount: number };
const emptyForm = { name: "", startDate: "", endDate: "", isCurrent: false };

export function BatchesManager({
  initialBatches,
}: {
  initialBatches: BatchRow[];
}) {
  const [batches, setBatches] = useState(initialBatches);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
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
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create batch");
        return;
      }
      setBatches((prev) => {
        const next = form.isCurrent
          ? prev.map((b) => ({ ...b, isCurrent: false }))
          : prev;
        return [{ ...data.batch, studentCount: 0 }, ...next];
      });
      closeForm();
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
  }

  async function makeCurrent(id: number) {
    setSwitching(id);
    const res = await fetch(`/api/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCurrent: true }),
    });
    if (res.ok) {
      setBatches((prev) => prev.map((b) => ({ ...b, isCurrent: b.id === id })));
    }
    setSwitching(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-[#9E1B32] dark:text-[#e8a3b0]" />
            Batches Management
          </h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Create, manage, and toggle active intern batch periods
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Batch</span>
        </button>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            All Batches ({batches.length})
          </h2>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="grid gap-3 sm:hidden">
          {batches.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {b.name}
                  </span>
                  {b.isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <Users className="h-3.5 w-3.5" />
                  {b.studentCount} interns
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(b.startDate)} – {formatDate(b.endDate)}
                </span>

                {!b.isCurrent && (
                  <button
                    onClick={() => makeCurrent(b.id)}
                    disabled={switching === b.id}
                    className="font-semibold text-[#9E1B32] hover:underline disabled:opacity-50 dark:text-[#e8a3b0]"
                  >
                    {switching === b.id ? "Updating..." : "Set Current"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Batch Name</th>
                <th scope="col" className="px-4 py-3">Date Range</th>
                <th scope="col" className="px-4 py-3">Enrolled Interns</th>
                <th scope="col" className="px-4 py-3 text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {batches.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                    {b.name}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-400 font-medium">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    {b.studentCount} interns
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {b.isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Current Active
                      </span>
                    ) : (
                      <button
                        onClick={() => makeCurrent(b.id)}
                        disabled={switching === b.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        {switching === b.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9E1B32]" />
                            Updating…
                          </>
                        ) : (
                          "Make Current"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}
        title="Create New Batch"
      >
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <form onSubmit={submit} className="grid gap-4 pt-1">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Batch Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Batch 2026-A"
              className={inputCls}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) =>
                setForm({ ...form, isCurrent: e.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-300 text-[#9E1B32] focus:ring-[#9E1B32]"
            />
            Mark as active current batch immediately
          </label>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Batch"
              )}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
