"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavShellProps {
  user: { name: string; username: string; role: "admin" | "staff" };
  children: React.ReactNode;
}

const STAFF_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/attendance", label: "Take Attendance" },
  { href: "/leaves", label: "Leaves" },
  { href: "/calendar", label: "Calendar" },
  { href: "/reports", label: "Reports" },
];
const ADMIN_LINKS = [
  { href: "/students", label: "Students" },
  { href: "/batches", label: "Batches" },
  { href: "/admin/users", label: "Staff Accounts" },
];

export function NavShell({ user, children }: NavShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const links = user.role === "admin" ? [...STAFF_LINKS, ...ADMIN_LINKS] : STAFF_LINKS;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-black/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tracking-wide text-[#9E1B32] dark:text-[#e07c8d]">MMC</span>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Attendance</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline dark:text-neutral-400">
              {user.name}
              <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                {user.role}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              {loggingOut ? "…" : "Log out"}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-0.5 border-t border-neutral-200 px-4 py-2 md:hidden dark:border-neutral-800">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === l.href
                    ? "bg-[#9E1B32]/10 text-[#9E1B32]"
                    : "text-neutral-600 dark:text-neutral-300"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
