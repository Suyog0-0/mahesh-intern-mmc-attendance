"use client";

import { useState } from "react";
import { CalendarPlus, Trash2, CalendarX, Eye, Search, X, Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { formatDate } from "@/lib/date";
import type { LeaveRow } from "@/lib/db/queries/leaves";

const emptyForm = { rollNumber: "", startDate: "", endDate: "", reason: "" };

export function LeavesManager({
  batchName,
  initialLeaves,
  initialStudentCount,
}: {
  batchName: string;
  initialLeaves: LeaveRow[];
  initialStudentCount: number;
}) {
  const { openStudent } = useStudentDrawer();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState(initialLeaves);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRow | null>(null);
  const [editTarget, setEditTarget] = useState<LeaveRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredLeaves = leaves.filter((leave) => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return true;
    return [leave.name, leave.rollNumber, leave.reason ?? "", leave.startDate, leave.endDate]
      .some((value) => value.toLocaleLowerCase().includes(search));
  });

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
  }

  function openEdit(leave: LeaveRow) {
    setEditTarget(leave);
    setForm({ rollNumber: leave.rollNumber, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason ?? "" });
    setError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editTarget || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/leaves/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startDate: form.startDate, endDate: form.endDate, reason: form.reason || null }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Could not update leave"); return; }
      setLeaves((current) => current.map((leave) => leave.id === editTarget.id ? { ...leave, ...result.leave } : leave));
      toast({ tone: "success", title: "Leave updated", description: editTarget.name });
      closeEdit();
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
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
      toast({ tone: "success", title: "Leave recorded", description: `${form.rollNumber} · ${formatDate(form.startDate)} – ${formatDate(form.endDate)}` });
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
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeaves((prev) => prev.filter((l) => l.id !== id));
        toast({ tone: "success", title: "Leave record deleted", description: deleteTarget.name });
      } else {
        toast({ tone: "error", title: "Could not delete leave record", description: "Please try again." });
      }
    } catch {
      toast({ tone: "error", title: "Network error", description: "The leave record was not deleted." });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Leave Records</h1>
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

      <section className="min-w-0">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <CalendarX className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            Logged Leave Applications <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{filteredLeaves.length}{query.trim() ? ` / ${leaves.length}` : ""}</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Search interns, roll numbers, reasons, or dates.</p>
          <div className="relative mt-3 w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leave records…"
              aria-label="Search leave applications"
              className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-9 text-xs text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900"
            />
            {query && <button type="button" aria-label="Clear leave search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"><X className="h-3.5 w-3.5" /></button>}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800 md:block">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Student</th>
                <th scope="col" className="px-4 py-3">Dates</th>
                <th scope="col" className="px-4 py-3">Reason</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {filteredLeaves.map((l) => (
                <tr
                  key={l.id}
                  className="group transition-colors hover:bg-neutral-50/90 dark:hover:bg-neutral-800/40"
                >
                  <td data-label="Student" className="px-4 py-3">
                    <button type="button" aria-label={`View ${l.name} profile`} onClick={() => openStudent(l.studentId)} className="inline-flex items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1B32]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9E1B32]/8 font-mono text-[10px] font-bold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">{l.rollNumber}</span><span className="font-semibold text-neutral-900 group-hover:text-[#9E1B32] dark:text-neutral-100 dark:group-hover:text-[#e8a3b0]">{l.name}</span><Eye className="ml-1 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" /></button>
                  </td>
                  <td data-label="Dates" className="px-4 py-3 text-neutral-600 font-mono dark:text-neutral-400">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </td>
                  <td data-label="Reason" className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{l.reason ?? "—"}</td>
                  <td data-label="Actions" className="px-4 py-3 text-right">
                    <button type="button" title="Edit leave record" aria-label={`Edit leave for ${l.name}`} onClick={() => openEdit(l)} className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40"><Pencil className="h-4 w-4" /></button>
                    <button
                      type="button"
                      title="Delete leave record"
                      aria-label={`Delete leave for ${l.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(l);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
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
                    {initialStudentCount === 0 ? "Add interns first before logging leave records." : leaves.length === 0 ? "No leave records logged yet." : "No leave applications match this search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile leave records */}
        <ul className="grid gap-3 md:hidden">
          {filteredLeaves.map((leave) => (
            <li key={leave.id} className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between gap-3">
                <button type="button" aria-label={`View ${leave.name} profile`} onClick={() => openStudent(leave.studentId)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1B32]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#9E1B32]/8 font-mono text-[10px] font-bold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">{leave.rollNumber}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{leave.name}</span><span className="mt-0.5 block text-[10px] font-medium text-neutral-500 dark:text-neutral-400">Intern profile</span></span>
                  <Eye className="ml-auto h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Edit leave for ${leave.name}`} title="Edit leave" onClick={() => openEdit(leave)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40"><Pencil className="h-4 w-4" /></button>
                <button type="button" aria-label={`Delete leave for ${leave.name}`} title="Delete leave" onClick={() => setDeleteTarget(leave)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-300 dark:hover:bg-red-950/40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div><p className="text-[9px] font-bold uppercase tracking-wider text-blue-700/70 dark:text-blue-300/70">From</p><p className="mt-0.5 text-[11px] font-semibold tabular-nums text-blue-950 dark:text-blue-100">{formatDate(leave.startDate)}</p></div>
                <div className="border-l border-blue-200 pl-2 dark:border-blue-900"><p className="text-[9px] font-bold uppercase tracking-wider text-blue-700/70 dark:text-blue-300/70">To</p><p className="mt-0.5 text-[11px] font-semibold tabular-nums text-blue-950 dark:text-blue-100">{formatDate(leave.endDate)}</p></div>
              </div>
              {leave.reason && <div className="mt-2 border-l-2 border-neutral-200 pl-2.5 dark:border-neutral-700">
                <p className="line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">{leave.reason}</p>
              </div>}
            </li>
          ))}
          {filteredLeaves.length === 0 && <li className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{initialStudentCount === 0 ? "Add interns first before logging leave records." : leaves.length === 0 ? "No leave records for this batch yet." : "No leave applications match this search."}</li>}
        </ul>
      </section>

      <Modal
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}
        title="Record Leave"
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

      <Modal open={!!editTarget} onOpenChange={(open) => !open && closeEdit()} title="Edit Leave Record" description={editTarget ? `${editTarget.name} · Roll #${editTarget.rollNumber}` : undefined}>
        {error && <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
        <form onSubmit={submitEdit} className="grid gap-3.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Reason (Optional)<input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className={inputCls} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">From<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={inputCls} /></label>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">To<input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={inputCls} /></label>
          </div>
          <Modal.Footer><button type="button" onClick={closeEdit} className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">Cancel</button><button type="submit" disabled={pending} className="rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save Changes"}</button></Modal.Footer>
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
  "mt-1 w-full rounded-lg border border-neutral-300/80 bg-white px-3.5 py-2 text-base sm:text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
