"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/modal";

interface NavShellProps {
  user: { name: string; username: string; role: "admin" | "staff" };
  children: React.ReactNode;
}

const PRIMARY_LINKS = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/attendance", label: "Attendance", icon: CheckIcon },
  { href: "/leaves", label: "Leaves", icon: CalendarOffIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
];

const MORE_LINKS_STAFF = [{ href: "/reports", label: "Reports" }];
const MORE_LINKS_ADMIN = [
  { href: "/reports", label: "Reports" },
  { href: "/students", label: "Students" },
  { href: "/batches", label: "Batches" },
  { href: "/admin/users", label: "Staff Accounts" },
];

export function NavShell({ user, children }: NavShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const moreLinks = user.role === "admin" ? MORE_LINKS_ADMIN : MORE_LINKS_STAFF;
  const allLinks = [
    ...PRIMARY_LINKS,
    ...moreLinks.map((l) => ({ ...l, icon: DotIcon })),
  ];
  const moreActive = moreLinks.some((l) => l.href === pathname);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex dark:border-neutral-800 dark:bg-black">
        <div className="flex h-14 items-center gap-1.5 border-b border-neutral-200 px-5 dark:border-neutral-800">
          <span className="text-sm font-bold tracking-wide text-[#9E1B32] dark:text-[#e07c8d]">
            MMC
          </span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Attendance
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {allLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                }`}
              >
                <l.icon className="h-4 w-4 shrink-0" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9E1B32]/10 text-sm font-semibold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize text-neutral-500 dark:text-neutral-400">
                {user.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            {loggingOut ? "…" : "Log out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-black/90">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold tracking-wide text-[#9E1B32] dark:text-[#e07c8d]">
            MMC
          </span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Attendance
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9E1B32]/10 text-xs font-semibold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
        >
          {loggingOut ? "…" : initials(user.name)}
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-black/95">
        {PRIMARY_LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active
                  ? "text-[#9E1B32] dark:text-[#e8a3b0]"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <l.icon className="h-5 w-5" />
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
            moreActive
              ? "text-[#9E1B32] dark:text-[#e8a3b0]"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          <MoreIcon className="h-5 w-5" />
          More
        </button>
      </nav>

      <Modal open={moreOpen} onOpenChange={setMoreOpen} title="More">
        <div className="flex flex-col gap-1">
          {moreLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMoreOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === l.href
                  ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
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

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M3 8.5 10 3l7 5.5V16a1 1 0 0 1-1 1h-3.5v-5h-5v5H4a1 1 0 0 1-1-1V8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 10.5 9 13l5-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CalendarOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect
        x="3"
        y="4.5"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 8.5h14M7 3v3M13 3v3M7.5 12.5l5-3M7.5 9.5l5 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect
        x="3"
        y="4.5"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 8.5h14M7 3v3M13 3v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <circle cx="4.5" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="15.5" cy="10" r="1.5" />
    </svg>
  );
}
function DotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}
