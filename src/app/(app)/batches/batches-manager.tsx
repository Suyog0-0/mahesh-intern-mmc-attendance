"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { formatDate } from "@/lib/date";
import type { Batch } from "@/lib/db/queries/batches";
import {
  Plus,
  FolderKanban,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

type BatchRow = Batch & { studentCount: number };
const emptyForm = { name: "", startDate: "", endDate: "", isCurrent: false };

export function BatchesManager({
  initialBatches,
}: {
  initialBatches: BatchRow[];
}) {
  const [batches, setBatches] = useState(initialBatches);
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<BatchRow | null>(null);

  // Edit state
  const [editTarget, setEditTarget] = useState<BatchRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", startDate: "", endDate: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<BatchRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
  }

  function openEdit(b: BatchRow) {
    setEditTarget(b);
    setEditForm({ name: b.name, startDate: b.startDate, endDate: b.endDate });
    setEditError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  function openDelete(b: BatchRow) {
    setDeleteTarget(b);
    setDeleteError(null);
  }

  function closeDelete() {
    setDeleteTarget(null);
    setDeleteError(null);
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
      toast({ tone: "success", title: "Batch created", description: data.batch.name });
      closeForm();
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || editPending) return;
    setEditPending(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/batches/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Could not update batch");
        return;
      }
      setBatches((prev) =>
        prev.map((b) =>
          b.id === editTarget.id ? { ...b, ...data.batch } : b,
        ),
      );
      toast({ tone: "success", title: "Batch updated", description: data.batch.name });
      closeEdit();
    } catch {
      setEditError("Network error — try again.");
    } finally {
      setEditPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deletePending) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/batches/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Could not delete batch");
        return;
      }
      setBatches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast({ tone: "success", title: "Batch deleted", description: deleteTarget.name });
      closeDelete();
    } catch {
      setDeleteError("Network error — try again.");
    } finally {
      setDeletePending(false);
    }
  }

  async function makeCurrent(id: number) {
    setSwitching(id);
    try {
      const res = await fetch(`/api/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true }),
      });
      if (!res.ok) {
        toast({ tone: "error", title: "Could not change current batch", description: "Please try again." });
        return;
      }
      setBatches((prev) => prev.map((b) => ({ ...b, isCurrent: b.id === id })));
      const batch = batches.find((item) => item.id === id);
      toast({ tone: "success", title: "Current batch changed", description: batch?.name });
    } catch {
      toast({ tone: "error", title: "Network error", description: "The current batch was not changed." });
    } finally {
      setSwitching(null);
    }
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

      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            All Batches ({batches.length})
          </h2>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800 md:block">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Batch Name</th>
                <th scope="col" className="px-4 py-3">Date Range</th>
                <th scope="col" className="px-4 py-3">Interns</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {batches.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td data-label="Batch" className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{b.name}</span>
                      {b.isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Date Range" className="px-4 py-3.5 text-neutral-600 dark:text-neutral-400 font-medium">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td data-label="Interns" className="px-4 py-3.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    {b.studentCount}
                  </td>
                  <td data-label="Actions" className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setViewTarget(b)} title="View batch" aria-label={`View ${b.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"><Eye className="h-4 w-4" /></button>
                      {!b.isCurrent && (
                        <button
                          onClick={() => makeCurrent(b.id)}
                          disabled={switching === b.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        title="Edit"
                        aria-label={`Edit ${b.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {!b.isCurrent && (
                        <button
                          type="button"
                          onClick={() => openDelete(b)}
                          title="Delete"
                          aria-label={`Delete ${b.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    No batches yet. Create a batch to start organizing interns.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile batch records */}
        <ul className="grid gap-3 md:hidden">
          {batches.map((batch) => (
            <li key={batch.id} className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{batch.name}</h3>
                    {batch.isCurrent && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Current</span>}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{formatDate(batch.startDate)} – {formatDate(batch.endDate)}</p>
                </div>
                <span className="shrink-0 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{batch.studentCount} interns</span>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <button type="button" aria-label={`View ${batch.name}`} title="View batch" onClick={() => setViewTarget(batch)} className="mr-auto flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"><Eye className="h-4 w-4" /></button>
                <button type="button" aria-label={`Edit ${batch.name}`} title="Edit batch" onClick={() => openEdit(batch)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/40"><Pencil className="h-4 w-4" /></button>
                {!batch.isCurrent && <button type="button" aria-label={`Delete ${batch.name}`} title="Delete batch" onClick={() => openDelete(batch)} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>}
                {!batch.isCurrent && <button type="button" onClick={() => makeCurrent(batch.id)} disabled={switching === batch.id} className="ml-1 min-h-9 rounded-lg bg-[#9E1B32]/[0.07] px-3 text-xs font-semibold text-[#9E1B32] hover:bg-[#9E1B32]/15 disabled:opacity-50 dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">{switching === batch.id ? "Updating…" : "Make current"}</button>}
              </div>
            </li>
          ))}
          {batches.length === 0 && <li className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">No batches yet. Create a batch to start organizing interns.</li>}
        </ul>
      </section>

      <Modal open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)} title={viewTarget?.name ?? "Batch details"} description="Batch overview">
        {viewTarget && <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40"><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Status</p><p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{viewTarget.isCurrent ? "Current batch" : "Archived batch"}</p></div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40"><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Interns</p><p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{viewTarget.studentCount}</p></div>
          <div className="col-span-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40"><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Batch dates</p><p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatDate(viewTarget.startDate)} – {formatDate(viewTarget.endDate)}</p></div>
        </div>}
        <Modal.Footer><button type="button" onClick={() => setViewTarget(null)} className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">Close</button></Modal.Footer>
      </Modal>

      {/* Create Batch Modal */}
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

      {/* Edit Batch Modal */}
      <Modal
        open={!!editTarget}
        onOpenChange={(open) => !open && closeEdit()}
        title="Edit Batch"
        description={editTarget ? `Editing: ${editTarget.name}` : undefined}
      >
        {editError && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {editError}
          </div>
        )}
        <form onSubmit={submitEdit} className="grid gap-4 pt-1">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Batch Name
            <input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Start Date
              <input
                required
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              End Date
              <input
                required
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
          <Modal.Footer>
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {editPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && closeDelete()}
        title="Delete Batch?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.name}"? This will also remove all ${deleteTarget.studentCount} intern record(s) and their attendance history.`
            : undefined
        }
      >
        {deleteError && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {deleteError}
          </div>
        )}
        <Modal.Footer>
          <button
            type="button"
            onClick={closeDelete}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deletePending}
            onClick={confirmDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deletePending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Batch
              </>
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-base sm:text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
