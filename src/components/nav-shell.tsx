"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarX,
  Calendar,
  FileSpreadsheet,
  Users,
  FolderKanban,
  UserCog,
  MoreHorizontal,
  LogOut,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { StudentDrawerProvider } from "@/components/student-drawer-context";
import { ToastProvider } from "@/components/toast-provider";

interface NavShellProps {
  user: { name: string; username: string; role: "admin" | "staff" };
  children: React.ReactNode;
}

const COMMON_PRIMARY_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const MORE_LINKS_STAFF = [{ href: "/reports", label: "Reports", icon: FileSpreadsheet }];
const MORE_LINKS_ADMIN = [
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/leaves", label: "Leaves", icon: CalendarX },
  { href: "/batches", label: "Batches", icon: FolderKanban },
  { href: "/admin/users", label: "Staff Accounts", icon: UserCog },
];

export function NavShell({ user, children }: NavShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreLinks = user.role === "admin" ? MORE_LINKS_ADMIN : MORE_LINKS_STAFF;
  const primaryLinks = user.role === "admin"
    ? [COMMON_PRIMARY_LINKS[0], COMMON_PRIMARY_LINKS[1], { href: "/students", label: "Students", icon: Users }, COMMON_PRIMARY_LINKS[2]]
    : [COMMON_PRIMARY_LINKS[0], COMMON_PRIMARY_LINKS[1], { href: "/leaves", label: "Leaves", icon: CalendarX }, COMMON_PRIMARY_LINKS[2]];
  const allLinks = [...primaryLinks, ...moreLinks];
  const moreActive = moreLinks.some((l) => l.href === pathname);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const nowDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nowDark);
    localStorage.setItem("theme", nowDark ? "dark" : "light");
    setIsDark(nowDark);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <ToastProvider>
      <StudentDrawerProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200/80 bg-white md:flex dark:border-neutral-800/80 dark:bg-neutral-900/60">
          <div className="flex h-16 items-center gap-2.5 border-b border-neutral-200/80 px-6 dark:border-neutral-800">
            <span className="flex h-8 px-2 items-center justify-center rounded-lg bg-[#9E1B32] text-xs font-black tracking-normal text-white shadow-2xs">
              MMC
            </span>
            <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Attendance System
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-4">
            {allLinks.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                      : "text-neutral-600 hover:bg-neutral-100/80 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-neutral-200/80 p-4 dark:border-neutral-800 space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#9E1B32]/10 text-xs font-bold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">
                {initials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {user.name}
                </p>
                <p className="text-[11px] capitalize text-neutral-400 font-medium">
                  {user.role} Account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300/80 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <Settings className="h-3.5 w-3.5 text-neutral-500" />
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300/80 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-3.5 w-3.5" />
                {loggingOut ? "..." : "Logout"}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-200/80 bg-white/95 px-4 backdrop-blur-md md:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 px-1.5 items-center justify-center rounded-md bg-[#9E1B32] text-[10px] font-black tracking-normal text-white">
              MMC
            </span>
            <span className="text-xs font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Attendance
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Toggle profile menu"
                className="flex h-9 items-center gap-1 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2 text-xs font-bold text-[#9E1B32] shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:border-neutral-700 dark:bg-neutral-900 dark:text-[#e8a3b0] dark:hover:bg-neutral-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9E1B32]/10 dark:bg-[#9E1B32]/20">{initials(user.name)}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

            {/* Mobile Header Dropdown Popover */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 animate-in fade-in slide-in-from-top-2 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30">
                <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9E1B32]/10 text-xs font-bold text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]">{initials(user.name)}</span>
                  <div className="min-w-0"><p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</p><p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">@{user.username}</p></div>
                </div>
                <div className="px-4 py-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#9E1B32]/[0.07] px-2 py-1 text-[10px] font-semibold capitalize text-[#9E1B32] dark:bg-[#9E1B32]/15 dark:text-[#e8a3b0]"><ShieldCheck className="h-3 w-3" />{user.role} account</span></div>
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="mx-2 mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Settings className="h-4 w-4 text-neutral-500" />
                  Settings & Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mx-2 mb-2 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Logging out…" : "Log Out"}
                </button>
              </div>
            )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto min-w-0 w-full max-w-6xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-neutral-200/80 bg-white/95 backdrop-blur-md md:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
          {primaryLinks.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold ${
                  active
                    ? "text-[#9E1B32] dark:text-[#e8a3b0]"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold ${
              moreActive
                ? "text-[#9E1B32] dark:text-[#e8a3b0]"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
            More
          </button>
        </nav>

        {/* Mobile More Navigation Sheet */}
        <Modal open={moreOpen} onOpenChange={setMoreOpen} title="Navigation Menu">
          <div className="flex flex-col gap-1.5 pt-1">
            {moreLinks.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#9E1B32]/10 text-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0]"
                      : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </Modal>
      </div>
      </StudentDrawerProvider>
    </ToastProvider>
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
