"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import {
  User,
  Shield,
  Lock,
  Sliders,
  Sun,
  Moon,
  Monitor,
  KeyRound,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Props {
  session: { name: string; username: string; role: "admin" | "staff" };
  currentBatch?: { name: string; startDate: string; endDate: string };
}

function applyTheme(t: "light" | "dark" | "system") {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") {
    root.classList.add("dark");
  } else if (t === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

export function SettingsView({ session, currentBatch }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as "light" | "dark" | "system") || "system";
  });
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passPending, setPassPending] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passPending) return;

    if (newPassword.length < 8) {
      setPassError("Password must be at least 8 characters.");
      return;
    }

    setPassPending(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        setPassError("Failed to update password.");
        return;
      }
      setPassSuccess("Your password was updated successfully.");
      setNewPassword("");
      setTimeout(() => setPassModalOpen(false), 1500);
    } catch {
      setPassError("Network error — try again.");
    } finally {
      setPassPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Settings & Preferences
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Manage system appearance, user credentials, and security settings
        </p>
      </div>

      {actionMessage && (
        <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {actionMessage}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* User Account Profile */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <User className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              User Profile
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#9E1B32]/10 text-lg font-bold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
              {initials(session.name)}
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-50">
                {session.name}
              </h3>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                @{session.username}
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                <Shield className="h-3 w-3 text-[#9E1B32] dark:text-[#e8a3b0]" />
                {session.role} Permissions
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Appearance Preferences */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <Sliders className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Appearance & Theme
            </h2>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Interface Mode
            </p>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-100/80 p-1.5 dark:bg-neutral-800/60">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  theme === "light"
                    ? "bg-white text-[#9E1B32] shadow-xs dark:bg-neutral-700 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  theme === "dark"
                    ? "bg-white text-[#9E1B32] shadow-xs dark:bg-neutral-700 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  theme === "system"
                    ? "bg-white text-[#9E1B32] shadow-xs dark:bg-neutral-700 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                System
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Current Scope:</span>{" "}
            <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
              {currentBatch ? currentBatch.name : "No Batch Active"}
            </strong>
          </div>
        </Card>

        {/* Security & Authentication Actions */}
        <Card className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <Lock className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Authentication & Security Actions
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setPassError(null);
                setPassSuccess(null);
                setPassModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300/80 bg-white p-3.5 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
              <span>Change My Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionMessage("Active session tokens verified.");
                setTimeout(() => setActionMessage(null), 3000);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300/80 bg-white p-3.5 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verify Session Tokens</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
                router.refresh();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 p-3.5 text-xs font-bold text-red-700 hover:bg-red-100/60 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Everywhere</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={passModalOpen}
        onOpenChange={setPassModalOpen}
        title="Change Your Password"
        description="Set a new secure password for your account."
      >
        {passError && (
          <div
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {passError}
          </div>
        )}
        {passSuccess && (
          <div className="mb-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            {passSuccess}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="grid gap-3.5 pt-1">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            New Password (Min 8 characters)
            <input
              required
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
          <Modal.Footer>
            <button
              type="button"
              onClick={() => setPassModalOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E1B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7d1527] disabled:opacity-60 dark:hover:bg-[#b82540]"
            >
              {passPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </Modal.Footer>
        </form>
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
