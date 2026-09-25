"use client";

import { useState } from "react";
import {
  UserCog,
  UserPlus,
  KeyRound,
  Shield,
  Loader2,
  CheckCircle2,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import type { PublicUser } from "@/lib/db/queries/users";

const emptyForm = {
  username: "",
  name: "",
  password: "",
  role: "staff" as "admin" | "staff",
};

const emptyEditForm = {
  name: "",
  username: "",
  role: "staff" as "admin" | "staff",
};

export function UsersManager({ initialUsers }: { initialUsers: PublicUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Reset password state
  const [resetTarget, setResetTarget] = useState<PublicUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<PublicUser | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<PublicUser | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
  }

  function closeReset() {
    setResetTarget(null);
    setResetPassword("");
    setResetError(null);
  }

  function openEdit(u: PublicUser) {
    setEditTarget(u);
    setEditForm({ name: u.name, username: u.username, role: u.role });
    setEditError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  function openDelete(u: PublicUser) {
    setDeleteTarget(u);
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
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account");
        return;
      }
      setUsers((prev) => [...prev, data.user]);
      closeForm();
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget || resetPending) return;
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setResetPending(true);
    setResetError(null);

    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      if (!res.ok) {
        setResetError("Could not update password.");
        return;
      }
      setResetMessage(`Password reset successfully for @${resetTarget.username}.`);
      closeReset();
    } catch {
      setResetError("Network error — try again.");
    } finally {
      setResetPending(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || editPending) return;
    setEditPending(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Could not update account");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? data.user : u)));
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
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Could not delete account");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      closeDelete();
    } catch {
      setDeleteError("Network error — try again.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <UserCog className="h-6 w-6 text-[#9E1B32] dark:text-[#e8a3b0]" />
            Staff Accounts Management
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Create and manage admin and staff accounts
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Account</span>
        </button>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Authorized Accounts ({users.length})
          </h2>
        </div>

        {resetMessage && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {resetMessage}
          </div>
        )}

        {/* Mobile View Cards */}
        <div className="grid gap-3 sm:hidden">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {u.name}
                  </h3>
                  <p className="text-xs font-mono text-neutral-400 truncate">@{u.username}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    u.role === "admin"
                      ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {u.role}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <button
                  onClick={() => openEdit(u)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setResetTarget(u);
                    setResetMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset Password
                </button>
                <button
                  onClick={() => openDelete(u)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No accounts found.
            </p>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Username</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#9E1B32]/10 text-[10px] font-black text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
                        {initials(u.name)}
                      </div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-neutral-600 dark:text-neutral-400">
                    @{u.username}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        u.role === "admin"
                          ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setResetTarget(u);
                          setResetMessage(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => openDelete(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Account Modal */}
      <Modal
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}
        title="Create Staff Account"
        description="Add a new authorized account for taking or managing attendance."
      >
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <form onSubmit={submit} className="grid gap-3.5 pt-1">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Full Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dr. Mahesh"
              className={inputCls}
            />
          </label>

          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Username
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. mahesh"
              className={inputCls}
            />
          </label>

          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Initial Password <span className="font-normal text-neutral-400">(Min 8 chars)</span>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className={inputCls}
            />
          </label>

          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Role
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "admin" | "staff" })
              }
              className={inputCls}
            >
              <option value="staff">Staff — Attendance Logging</option>
              <option value="admin">Admin — Full System Control</option>
            </select>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        open={!!editTarget}
        onOpenChange={(open) => !open && closeEdit()}
        title="Edit Account"
        description={editTarget ? `Edit details for @${editTarget.username}` : undefined}
      >
        {editError && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {editError}
          </div>
        )}
        <form onSubmit={submitEdit} className="grid gap-3.5 pt-1">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Full Name
            <input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Full name"
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Username
            <input
              required
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              placeholder="Username"
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Role
            <select
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value as "admin" | "staff" })
              }
              className={inputCls}
            >
              <option value="staff">Staff — Attendance Logging</option>
              <option value="admin">Admin — Full System Control</option>
            </select>
          </label>

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

      {/* Reset Password Modal */}
      <Modal
        open={!!resetTarget}
        onOpenChange={(open) => !open && closeReset()}
        title="Reset Account Password"
        description={
          resetTarget
            ? `Set a new password for @${resetTarget.username} (${resetTarget.name}).`
            : undefined
        }
      >
        {resetError && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {resetError}
          </div>
        )}
        <form onSubmit={submitReset} className="grid gap-3.5 pt-1">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            New Password <span className="font-normal text-neutral-400">(Min 8 characters)</span>
            <input
              required
              type="password"
              minLength={8}
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className={inputCls}
              placeholder="Enter new password"
            />
          </label>
          <Modal.Footer>
            <button
              type="button"
              onClick={closeReset}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {resetPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating…
                </>
              ) : (
                "Save Password"
              )}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && closeDelete()}
        title="Delete Account?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete the account for @${deleteTarget.username} (${deleteTarget.name})? This cannot be undone.`
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
                Delete Account
              </>
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const inputCls =
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
