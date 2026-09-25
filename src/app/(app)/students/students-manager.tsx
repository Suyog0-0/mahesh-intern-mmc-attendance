"use client";

import { useState } from "react";
import { UserPlus, Search, Pencil, Trash2, Users, Calendar } from "lucide-react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { useStudentDrawer } from "@/components/student-drawer-context";
import type { Student } from "@/lib/db/queries/students";
import type { Batch } from "@/lib/db/queries/batches";

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

  const filtered = students.filter((s) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q)
    );
  });

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
        setStudents((prev) =>
          prev.map((s) => (s.id === editingId ? data.student : s)),
        );
      } else {
        setStudents((prev) => [...prev, data.student]);
      }
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
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) setStudents((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Registered Interns
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Active Batch: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{batchName}</strong>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Intern</span>
        </button>
      </div>

      {/* Main Intern Table Card */}
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
              Intern Directory ({students.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Click any intern row to open complete attendance history modal
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or roll number..."
              aria-label="Search students by name or roll number"
              className="w-full sm:w-64 rounded-lg border border-neutral-300/80 bg-white pl-9 pr-3.5 py-1.5 text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Mobile View Cards */}
        <div className="grid gap-3 sm:hidden">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => openStudent(s.id)}
              className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:active:bg-neutral-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#9E1B32] dark:text-[#e8a3b0]">
                    #{s.rollNumber}
                  </span>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {s.name}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-neutral-400" />
                  {s.postingPeriod}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(s);
                  }}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(s);
                  }}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No matching interns found.
            </p>
          )}
        </div>

        {/* Desktop Editorial Table */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">Roll #</th>
                <th scope="col" className="px-4 py-3">Full Name</th>
                <th scope="col" className="px-4 py-3">Posting Period (Date Range)</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {filtered.map((s) => (
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
                  <td className="px-4 py-3.5 font-mono font-bold text-[#9E1B32] group-hover:underline dark:text-[#e8a3b0]">
                    #{s.rollNumber}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-neutral-900 group-hover:text-[#9E1B32] dark:text-neutral-100 dark:group-hover:text-[#e8a3b0]">
                    {s.name}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-400 font-mono">
                    {s.postingPeriod}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      className="mr-3 font-semibold text-neutral-600 hover:text-[#9E1B32] dark:text-neutral-400 dark:hover:text-[#e8a3b0]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(s);
                      }}
                      className="font-semibold text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
                    >
                      Delete
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
                    No matching interns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posting Start Date">
              <input
                required
                type="date"
                value={form.postingStartDate}
                onChange={(e) =>
                  setForm({ ...form, postingStartDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Posting End Date">
              <input
                required
                type="date"
                value={form.postingEndDate}
                onChange={(e) =>
                  setForm({ ...form, postingEndDate: e.target.value })
                }
                className={inputCls}
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
              className="rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
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
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";

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
