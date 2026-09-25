"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { formatDate } from "@/lib/date";
import type { Batch } from "@/lib/db/queries/batches";
import {
  Plus,
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

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
      closeDelete();
    } catch {
      setDeleteError("Network error — try again.");
    } finally {
      setDeletePending(false);
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {b.name}
                  </span>
                  {b.isCurrent && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium shrink-0">
                  <Users className="h-3.5 w-3.5" />
                  {b.studentCount}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(b.startDate)} – {formatDate(b.endDate)}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                {!b.isCurrent && (
                  <button
                    onClick={() => makeCurrent(b.id)}
                    disabled={switching === b.id}
                    className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400"
                  >
                    {switching === b.id ? "Updating..." : "Set Current"}
                  </button>
                )}
                <button
                  onClick={() => openEdit(b)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                {!b.isCurrent && (
                  <button
                    onClick={() => openDelete(b)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
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
                <th scope="col" className="px-4 py-3">Interns</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {batches.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3.5">
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
                  <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-400 font-medium">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    {b.studentCount}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
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
                        onClick={() => openEdit(b)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {!b.isCurrent && (
                        <button
                          onClick={() => openDelete(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
