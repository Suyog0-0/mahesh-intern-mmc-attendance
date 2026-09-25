"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import type { Student } from "@/lib/db/queries/students";

interface Props {
  batchName: string;
  initialStudents: Student[];
}

const emptyForm = { rollNumber: "", name: "", postingPeriod: "", remarks: "" };

export function StudentsManager({ batchName, initialStudents }: Props) {
  const [students, setStudents] = useState(initialStudents);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const filtered = students.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
  });

  function startEdit(s: Student) {
    setEditingId(s.id);
    setForm({ rollNumber: s.rollNumber, name: s.name, postingPeriod: s.postingPeriod, remarks: s.remarks ?? "" });
    setError(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const payload = { ...form, remarks: form.remarks || null };
      const res = await fetch(editingId ? `/api/students/${editingId}` : "/api/students", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save student");
        return;
      }
      if (editingId) {
        setStudents((prev) => prev.map((s) => (s.id === editingId ? data.student : s)));
      } else {
        setStudents((prev) => [...prev, data.student]);
      }
      cancelEdit();
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: number) {
    setConfirmDelete(null);
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) setStudents((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Students</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{batchName}</p>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">{editingId ? "Edit student" : "Add student"}</h2>
        {error && (
          <div role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Roll number">
            <input required value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Posting period">
            <input required value={form.postingPeriod} onChange={(e) => setForm({ ...form, postingPeriod: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Remarks (optional)">
            <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]">
              {pending ? "Saving…" : editingId ? "Save changes" : "Add student"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700">
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Roster ({students.length})</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or roll…"
            className="w-48 rounded-lg border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th className="pb-2 pr-3">Roll</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Posting</th>
                <th className="pb-2 pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 pr-3">{s.rollNumber}</td>
                  <td className="py-2 pr-3">{s.name}</td>
                  <td className="py-2 pr-3">{s.postingPeriod}</td>
                  <td className="py-2 pr-3 text-right">
                    <button onClick={() => startEdit(s)} className="mr-3 text-xs font-medium text-neutral-500 hover:text-[#9E1B32] dark:text-neutral-400">
                      Edit
                    </button>
                    {confirmDelete === s.id ? (
                      <span className="inline-flex gap-1.5">
                        <button onClick={() => remove(s.id)} className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                          Confirm
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-neutral-500">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(s.id)} className="text-xs font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-500 dark:text-neutral-400">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
