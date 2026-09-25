"use client";

import { useState } from "react";
import {
  UserCog,
  UserPlus,
  KeyRound,
  Shield,
  Loader2,
  Pencil,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import type { PublicUser } from "@/lib/db/queries/users";
import { Pagination } from "@/components/pagination";
import type { AppRole } from "@/lib/auth/roles";
import { formatDate } from "@/lib/date";

const emptyForm = {
  username: "",
  name: "",
  password: "",
  role: "staff" as AppRole,
};

const emptyEditForm = {
  name: "",
  username: "",
  role: "staff" as AppRole,
};

export function UsersManager({ initialUsers, currentRole }: { initialUsers: PublicUser[]; currentRole: AppRole }) {
  const isSuperAdmin = currentRole === "superadmin";
  const [users, setUsers] = useState(initialUsers);
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [showInitialPassword, setShowInitialPassword] = useState(false);

  // Reset password state
  const [resetTarget, setResetTarget] = useState<PublicUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
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
  const [viewTarget, setViewTarget] = useState<PublicUser | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const visiblePage = Math.min(page, pageCount);
  const visibleUsers = users.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
    setShowInitialPassword(false);
  }

  function closeReset() {
    setResetTarget(null);
    setResetPassword("");
    setConfirmResetPassword("");
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
      toast({ tone: "success", title: "Account created", description: `@${data.user.username}` });
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
    if (resetPassword !== confirmResetPassword) {
      setResetError("Passwords do not match.");
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
      toast({ tone: "success", title: "Password updated", description: `@${resetTarget.username}` });
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
      toast({ tone: "success", title: "Account updated", description: `@${data.user.username}` });
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
      toast({ tone: "success", title: "Account deleted", description: `@${deleteTarget.username}` });
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
            <UserCog className="h-6 w-6 text-[#1E4F91] dark:text-[#A9C5EA]" />
            Staff Accounts Management
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Create and manage staff, admin, and protected super-admin accounts
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E4F91] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#12345D] focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:hover:bg-[#477DB9]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Account</span>
        </button>
      </div>

      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Authorized accounts</h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Manage sign-in access and account roles.</p>
          </div>
          <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{users.length} total</span>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800 md:block">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Username</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {visibleUsers.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td data-label="User" className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E4F91]/10 text-[10px] font-black text-[#1E4F91] dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]">
                        {initials(u.name)}
                      </div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{u.name}</span>
                    </div>
                  </td>
                  <td data-label="Username" className="px-4 py-3.5 font-mono text-neutral-600 dark:text-neutral-400">
                    @{u.username}
                  </td>
                  <td data-label="Role" className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        u.role === "superadmin"
                          ? "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                          : u.role === "admin"
                            ? "bg-[#1E4F91]/10 text-[#1E4F91] dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      {u.role === "superadmin" ? <Crown className="h-3 w-3" /> : u.role === "admin" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {u.role === "superadmin" ? "Super Admin" : u.role}
                    </span>
                  </td>
                  <td data-label="Actions" className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {u.role === "superadmin" ? (
                        <button
                          type="button"
                          onClick={() => setViewTarget(u)}
                          title="View account"
                          aria-label={`View ${u.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 text-violet-700 transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:border-violet-900/60 dark:text-violet-300 dark:hover:bg-violet-950/40"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      ) : <>
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        title="Edit"
                        aria-label={`Edit ${u.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetTarget(u);
                        }}
                        title="Reset Password"
                        aria-label={`Reset password for ${u.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 text-sky-700 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-950/40"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(u)}
                        title="Delete"
                        aria-label={`Delete ${u.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    No staff accounts yet. Create an account to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile account records */}
        <ul className="grid gap-3 md:hidden">
          {visibleUsers.map((user) => (
            <li key={user.id} className="rounded-xl border border-neutral-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E4F91]/10 bg-[#1E4F91]/[0.06] text-xs font-bold tracking-wide text-[#1E4F91] dark:border-[#A9C5EA]/15 dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]">{initials(user.name)}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</h3>
                  <p className="mt-0.5 truncate font-mono text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${user.role === "superadmin" ? "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200" : user.role === "admin" ? "border-[#1E4F91]/15 bg-[#1E4F91]/[0.06] text-[#163B69] dark:border-[#A9C5EA]/15 dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]" : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"}`}>
                  {user.role === "superadmin" ? <Crown className="h-3 w-3" /> : user.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {user.role === "superadmin" ? "Super Admin" : user.role}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{user.role === "superadmin" ? "Protected account" : "Account actions"}</span>
                <div className="flex items-center gap-1">
                  {user.role === "superadmin" ? (
                    <button type="button" aria-label={`View ${user.name}`} title="View account" onClick={() => setViewTarget(user)} className="flex h-9 w-9 items-center justify-center rounded-lg text-violet-700 transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:text-violet-300 dark:hover:bg-violet-950/40"><Eye className="h-4 w-4" /></button>
                  ) : <>
                  <button type="button" aria-label={`Edit ${user.name}`} title="Edit account" onClick={() => openEdit(user)} className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/40"><Pencil className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Reset password for ${user.name}`} title="Reset password" onClick={() => setResetTarget(user)} className="flex h-9 w-9 items-center justify-center rounded-lg text-sky-700 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:text-sky-300 dark:hover:bg-sky-950/40"><KeyRound className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Delete ${user.name}`} title="Delete account" onClick={() => openDelete(user)} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                  </>}
                </div>
              </div>
            </li>
          ))}
          {users.length === 0 && <li className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">No staff accounts yet. Create an account to get started.</li>}
        </ul>
        <Pagination page={visiblePage} pageCount={pageCount} total={users.length} pageSize={pageSize} onPageChange={setPage} />
      </section>

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
            <div className="relative mt-1.5">
              <input
                required
                type={showInitialPassword ? "text" : "password"}
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={`${inputCls} pr-11`}
              />
              <button type="button" onClick={() => setShowInitialPassword((visible) => !visible)} aria-label={showInitialPassword ? "Hide initial password" : "Show initial password"} aria-pressed={showInitialPassword} className="absolute inset-y-0 right-1 flex w-9 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
                {showInitialPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Role
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as AppRole })
              }
              className={inputCls}
            >
              <option value="staff">Staff — Attendance Logging</option>
              <option value="admin">Admin — Full System Control</option>
              {isSuperAdmin && <option value="superadmin">Super Admin — Full Access · View-only account</option>}
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4F91] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12345D] disabled:opacity-60 dark:hover:bg-[#477DB9]"
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
                setEditForm({ ...editForm, role: e.target.value as AppRole })
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4F91] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12345D] disabled:opacity-60 dark:hover:bg-[#477DB9]"
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
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Re-enter New Password
            <input
              required
              type="password"
              minLength={8}
              value={confirmResetPassword}
              onChange={(e) => setConfirmResetPassword(e.target.value)}
              className={inputCls}
              placeholder="Confirm new password"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4F91] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12345D] disabled:opacity-60 dark:hover:bg-[#477DB9]"
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

      <Modal
        open={!!viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
        title="Super-admin account"
        description="This account is protected and can only be viewed."
      >
        {viewTarget && (
          <dl className="grid gap-3 rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
            <AccountDetail label="Name" value={viewTarget.name} />
            <AccountDetail label="Username" value={`@${viewTarget.username}`} />
            <AccountDetail label="Access" value="Super Admin · Full application access" />
            <AccountDetail label="Created" value={formatDate(viewTarget.createdAt.toISOString().slice(0, 10))} />
          </dl>
        )}
        <Modal.Footer>
          <button type="button" onClick={() => setViewTarget(null)} className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white">Close</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-violet-700/75 dark:text-violet-300/75">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-neutral-900 dark:text-neutral-100">{value}</dd>
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
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-base sm:text-xs text-neutral-900 outline-none focus:border-[#1E4F91] focus:ring-2 focus:ring-[#1E4F91]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
