"use client";

import { useState } from "react";
import { UserCog, UserPlus, KeyRound, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import type { PublicUser } from "@/lib/db/queries/users";

const emptyForm = {
  username: "",
  name: "",
  password: "",
  role: "staff" as "admin" | "staff",
};

export function UsersManager({ initialUsers }: { initialUsers: PublicUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<PublicUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);

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
            Create administrative and staff access accounts with role-based permissions
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#7d1527] focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-[#b82540]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Staff Account</span>
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
            <CheckCircle2 className="h-4 w-4" />
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {u.name}
                  </h3>
                  <p className="text-xs font-mono text-neutral-400">@{u.username}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  <Shield className="h-3 w-3 text-[#9E1B32] dark:text-[#e8a3b0]" />
                  {u.role}
                </span>
              </div>
              <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800 text-right">
                <button
                  onClick={() => {
                    setResetTarget(u);
                    setResetMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E1B32] hover:underline dark:text-[#e8a3b0]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Editorial Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/80 font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Username</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3 text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800/60 dark:bg-neutral-900">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                    {u.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-neutral-600 dark:text-neutral-400">
                    @{u.username}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      <Shield className="h-3 w-3 text-[#9E1B32] dark:text-[#e8a3b0]" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setResetTarget(u);
                        setResetMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset Password
                    </button>
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
            Initial Password (Min 8 chars)
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
            Role Permission
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "admin" | "staff" })
              }
              className={inputCls}
            >
              <option value="staff">Staff (Attendance Logging)</option>
              <option value="admin">Admin (Full System Control)</option>
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
            New Password (Min 8 characters)
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
    </div>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100";
