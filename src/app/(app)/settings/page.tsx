import { requirePageSession } from "@/lib/auth/page-guards";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { Card } from "@/components/card";
import { User, Shield, Lock, Sliders, Database, Key } from "lucide-react";
import { formatDate } from "@/lib/date";

export default async function SettingsPage() {
  const session = await requirePageSession();
  const currentBatch = await getCurrentBatch();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Account & App Settings
        </h1>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Manage your account security, system preferences, and session controls
        </p>
      </div>

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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9E1B32]/10 text-lg font-bold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
              {initials(session.name)}
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-50">
                {session.name}
              </h3>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                @{session.username}
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                <Shield className="h-3 w-3 text-[#9E1B32] dark:text-[#e8a3b0]" />
                {session.role} Role
              </div>
            </div>
          </div>
        </Card>

        {/* Active Batch & System Info */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <Sliders className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Active System Scope
            </h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-medium text-neutral-400 uppercase tracking-wider text-[10px]">Current Batch</span>
              <p className="mt-0.5 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {currentBatch ? currentBatch.name : "No Batch Active"}
              </p>
              {currentBatch && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {formatDate(currentBatch.startDate)} – {formatDate(currentBatch.endDate)}
                </p>
              )}
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Environment</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">Production / Vercel</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Database Engine</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">Neon Postgres</span>
            </div>
          </div>
        </Card>

        {/* Security & Authentication */}
        <Card className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <Lock className="h-4 w-4 text-[#9E1B32] dark:text-[#e8a3b0]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Authentication & Security
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Session Token Security
              </h4>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Your session is secured using standard HTTP-Only Cookie JWT authentication. Sessions auto-renew on activity and expire securely upon explicit logout.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Data Access Scope
              </h4>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {session.role === "admin"
                  ? "Admin privileges enabled. You can create batches, edit staff accounts, manage intern rosters, and generate attendance logs."
                  : "Staff access enabled. You can record daily attendance, view student rosters, manage leaves, and export reports."}
              </p>
            </div>
          </div>
        </Card>
      </div>
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
