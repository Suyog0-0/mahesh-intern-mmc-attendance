"use client";

import { useState } from "react";
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

  async function submitReset() {
    if (!resetTarget) return;
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    const res = await fetch(`/api/admin/users/${resetTarget.id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    if (!res.ok) {
      setResetError("Could not update password.");
      return;
    }
    setResetMessage(`Password updated for ${resetTarget.username}.`);
    closeReset();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Staff Accounts</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
        >
          + Create account
        </button>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">
          Accounts ({users.length})
        </h2>
        {resetMessage && (
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            {resetMessage}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th className="pb-2 pr-3">Username</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Role</th>
                <th className="pb-2 pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 pr-3">{u.username}</td>
                  <td className="py-2 pr-3">{u.name}</td>
                  <td className="py-2 pr-3 capitalize">{u.role}</td>
                  <td className="py-2 pr-3 text-right">
                    <button
                      onClick={() => {
                        setResetTarget(u);
                        setResetMessage(null);
                      }}
                      className="text-xs font-medium text-neutral-500 hover:text-[#9E1B32] dark:text-neutral-400"
                    >
                      Reset password
                    </button>
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
        title="Create account"
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
            Username
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium">
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "admin" | "staff" })
              }
              className={inputCls}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Modal.Footer>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {pending ? "Creating…" : "Create account"}
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

      <Modal
        open={!!resetTarget}
        onOpenChange={(open) => !open && closeReset()}
        title="Reset password"
        description={
          resetTarget
            ? `Set a new password for ${resetTarget.username}.`
            : undefined
        }
      >
        {resetError && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
          >
            {resetError}
          </div>
        )}
        <label className="block text-sm font-medium">
          New password
          <input
            type="password"
            minLength={8}
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className={inputCls}
            placeholder="Min 8 characters"
          />
        </label>
        <Modal.Footer>
          <button
            onClick={submitReset}
            className="rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d1527] dark:hover:bg-[#b82540]"
          >
            Save
          </button>
          <button
            onClick={closeReset}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700";
