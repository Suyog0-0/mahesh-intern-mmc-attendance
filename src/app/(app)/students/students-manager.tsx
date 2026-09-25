"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, Eye, CalendarDays } from "lucide-react";
import { Modal } from "@/components/modal";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { useToast } from "@/components/toast-provider";
import type { Student } from "@/lib/db/queries/students";
import type { Batch } from "@/lib/db/queries/batches";
import { formatPostingPeriod } from "@/lib/date";
import { NepaliDateInput } from "@/components/nepali-date-input";
import { Pagination } from "@/components/pagination";

interface Props {
  batchName: string;
  currentBatchId: number;
  batches: Batch[];
  initialStudents: Student[];
}

export function StudentsManager({
  batchName,
  currentBatchId,
  batches,
  initialStudents,
}: Props) {
  const { openStudent } = useStudentDrawer();
  const { toast } = useToast();
  const [students, setStudents] = useState(initialStudents);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const emptyForm = {
    batchId: currentBatchId,
    rollNumber: "",
    name: "",
    postingStartDate: "",
    postingEndDate: "",
    remarks: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = students.filter((s) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePage = Math.min(page, pageCount);
  const visibleStudents = filtered.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm, batchId: currentBatchId });
    setError(null);
    setFormOpen(true);
  }

  function openEdit(s: Student) {
    setEditingId(s.id);

    let startDate = "";
    let endDate = "";
    if (s.postingPeriod.includes(" to ")) {
      const parts = s.postingPeriod.split(" to ");
      startDate = parts[0].trim();
      endDate = parts[1].trim();
    } else if (s.postingPeriod.includes(" – ")) {
      const parts = s.postingPeriod.split(" – ");
      startDate = parts[0].trim();
      endDate = parts[1].trim();
    }

    setForm({
      batchId: s.batchId,
      rollNumber: s.rollNumber,
      name: s.name,
      postingStartDate: startDate,
      postingEndDate: endDate,
      remarks: s.remarks ?? "",
    });
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    if (!form.postingStartDate || !form.postingEndDate) {
      setError("Please select both Posting Start Date and End Date.");
      return;
    }

    if (form.postingStartDate > form.postingEndDate) {
      setError("Posting Start Date cannot be after End Date.");
      return;
    }

    setPending(true);
    setError(null);

    const postingPeriod = `${form.postingStartDate} to ${form.postingEndDate}`;

    try {
      const payload = {
        batchId: Number(form.batchId),
        rollNumber: form.rollNumber.trim(),
        name: form.name.trim(),
        postingPeriod,
        remarks: form.remarks ? form.remarks.trim() : null,
      };

      const res = await fetch(
        editingId ? `/api/students/${editingId}` : "/api/students",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save student record");
        return;
      }
      if (editingId) {
        if (data.student.batchId !== currentBatchId) {
          setStudents((prev) => prev.filter((s) => s.id !== editingId));
        } else {
          setStudents((prev) =>
            prev.map((s) => (s.id === editingId ? data.student : s)),
          );
        }
      } else {
        setStudents((prev) => [...prev, data.student]);
      }
      toast({
        tone: "success",
        title: editingId ? "Intern record updated" : "Intern added",
        description: `${data.student.name} · Roll #${data.student.rollNumber}`,
      });
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
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        toast({ tone: "success", title: "Intern record deleted", description: deleteTarget.name });
      } else {
        const data = await res.json().catch(() => null);
        toast({ tone: "error", title: "Could not delete intern", description: data?.error ?? "Please try again." });
      }
    } catch {
      toast({ tone: "error", title: "Network error", description: "The intern record was not deleted." });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Registered Interns
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" />
            Active batch <span className="font-semibold">{batchName}</span>
          </p>
        </div>
      </div>

      {/* Main Intern Table Card */}
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#1E4F91] dark:text-[#A9C5EA]" />
              Intern Directory ({students.length})
            </h2>
            <button type="button" onClick={openAdd} aria-label="Add intern" title="Add intern" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E4F91] text-white transition-colors hover:bg-[#12345D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] sm:hidden dark:hover:bg-[#477DB9]"><Plus className="h-5 w-5" /></button>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">Search interns here.</p>
          </div>
          <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name or roll number..."
              aria-label="Search students by name or roll number"
              className="w-full rounded-lg border border-neutral-300/80 bg-white py-2 pl-9 pr-3.5 text-xs text-neutral-900 outline-none transition-colors focus:border-[#1E4F91] focus:ring-2 focus:ring-[#1E4F91]/20 sm:w-64 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
          <button type="button" onClick={openAdd} aria-label="Add intern" title="Add intern" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E4F91] text-white transition-colors hover:bg-[#12345D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] sm:inline-flex dark:hover:bg-[#477DB9]"><Plus className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800 md:block">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Roll #</th>
                <th scope="col" className="px-4 py-3">Full Name</th>
                <th scope="col" className="px-4 py-3">Posting Period (Date Range)</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {visibleStudents.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openStudent(s.id)}
                  className="group cursor-pointer transition-colors hover:bg-neutral-50/90 dark:hover:bg-neutral-800/40"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openStudent(s.id);
                    }
                  }}
                  title="Click to view full intern history"
                >
                  <td data-label="Roll #" className="px-4 py-3.5 font-mono font-bold text-[#1E4F91] group-hover:underline dark:text-[#A9C5EA]">
                    #{s.rollNumber}
                  </td>
                  <td data-label="Full Name" className="px-4 py-3.5 font-semibold text-neutral-900 group-hover:text-[#1E4F91] dark:text-neutral-100 dark:group-hover:text-[#A9C5EA]">
                    {s.name}
                  </td>
                  <td data-label="Posting Period" className="px-4 py-3.5 text-neutral-600 dark:text-neutral-400 font-mono">
                    {formatPostingPeriod(s.postingPeriod)}
                  </td>
                  <td data-label="Actions" className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        aria-label={`View ${s.name} profile`}
                        onClick={(e) => { e.stopPropagation(); openStudent(s.id); }}
                        className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-[#1E4F91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:hover:bg-neutral-800 dark:hover:text-[#A9C5EA]"
                      ><Eye className="h-4 w-4" /></button>
                      <button
                        type="button"
                        aria-label={`Edit ${s.name}`}
                        onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40"
                    >
                      <Pencil className="h-4 w-4 inline-block" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      aria-label={`Delete ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(s);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {students.length === 0 ? "Add interns first to start managing this batch." : "No matching interns found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile intern records */}
        <ul className="grid gap-3 md:hidden">
          {visibleStudents.map((student) => (
            <li key={student.id} className="rounded-xl border border-neutral-200/90 bg-white p-3 shadow-sm shadow-neutral-900/[0.025] transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
              <button type="button" aria-label={`View ${student.name} profile`} onClick={() => openStudent(student.id)} className="flex w-full min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91]">
                <span className="flex h-9 min-w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E4F91]/[0.07] px-2 font-mono text-[11px] font-bold text-[#1E4F91] dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]">#{student.rollNumber}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{student.name}</span>
                  <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1 text-[10px] font-medium tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"><CalendarDays className="h-3 w-3 shrink-0 text-[#1E4F91] dark:text-[#A9C5EA]" />{formatPostingPeriod(student.postingPeriod)}</span>
              </span>
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300"><Eye className="h-4 w-4" /></span>
              </button>
              <div className="mt-3 flex items-center justify-end gap-3 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" aria-label={`Edit ${student.name}`} title="Edit intern" onClick={() => openEdit(student)} className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Delete ${student.name}`} title="Delete intern" onClick={() => setDeleteTarget(student)} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-300 dark:hover:bg-red-950/40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{students.length === 0 ? "Add interns first to start managing this batch." : "No matching interns found."}</li>}
        </ul>
        <Pagination page={visiblePage} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </section>

      {/* Add / Edit Student Modal */}
      <Modal
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}
        title={editingId ? "Edit Intern Record" : "Add New Intern"}
        description="Fill out the intern details below with explicit batch and posting period dates."
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <form onSubmit={submit} className="grid gap-3.5 py-1">
          {/* Batch Selector Dropdown */}
          <Field label="Assign Batch">
            <div className="relative mt-1.5">
              <select
                value={form.batchId}
                onChange={(e) =>
                  setForm({ ...form, batchId: Number(e.target.value) })
                }
                className={inputCls}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isCurrent ? "(Current Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Roll Number">
            <input
              required
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
              placeholder="e.g. 1"
              className={inputCls}
            />
          </Field>
          <Field label="Full Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dr. Mahesh Sharma"
              className={inputCls}
            />
          </Field>

          {/* Validated Date Range for Posting Period */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-3 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-800/30">
            <Field label="Posting Start Date">
              <NepaliDateInput
                required
                value={form.postingStartDate}
                onChange={(value) => setForm({ ...form, postingStartDate: value })}
              />
            </Field>
            <Field label="Posting End Date">
              <NepaliDateInput
                required
                value={form.postingEndDate}
                onChange={(value) => setForm({ ...form, postingEndDate: value })}
              />
            </Field>
          </div>

          <Field label="Remarks / Notes (Optional)">
            <input
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. Surgery rotation"
              className={inputCls}
            />
          </Field>

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
              className="rounded-lg bg-[#1E4F91] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12345D] disabled:opacity-60 dark:hover:bg-[#477DB9]"
            >
              {pending ? "Saving…" : editingId ? "Save Changes" : "Add Intern"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Intern Record?"
        description={
          deleteTarget
            ? `This permanently removes ${deleteTarget.name} (Roll #${deleteTarget.rollNumber}) and all associated attendance records and leave logs. This action cannot be undone.`
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
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-base sm:text-xs text-neutral-900 outline-none transition-colors focus:border-[#1E4F91] focus:ring-2 focus:ring-[#1E4F91]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
      {label}
      {children}
    </label>
  );
}
