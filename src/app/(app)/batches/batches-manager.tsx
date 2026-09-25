"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { formatDate } from "@/lib/date";
import type { Batch } from "@/lib/db/queries/batches";

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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Batches</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
        >
          + Create batch
        </button>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">
          All batches ({batches.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Dates</th>
                <th className="pb-2 pr-3">Students</th>
                <th className="pb-2 pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="py-2 pr-3 font-medium">
                    {b.name}
                    {b.isCurrent && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-neutral-500 dark:text-neutral-400">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td className="py-2 pr-3">{b.studentCount}</td>
                  <td className="py-2 pr-3 text-right">
                    {!b.isCurrent && (
                      <button
                        onClick={() => makeCurrent(b.id)}
                        disabled={switching === b.id}
                        className="text-xs font-medium text-neutral-500 hover:text-[#9E1B32] disabled:opacity-50 dark:text-neutral-400"
                      >
                        {switching === b.id ? "…" : "Make current"}
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
        title="Create batch"
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
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) =>
                setForm({ ...form, isCurrent: e.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-300"
            />
            Make this the current batch
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
              {pending ? "Creating…" : "Create batch"}
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
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700";
