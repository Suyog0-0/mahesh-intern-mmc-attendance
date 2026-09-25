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
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { StudentDrawerProvider } from "@/components/student-drawer-context";
import { ToastProvider } from "@/components/toast-provider";
import type { AppRole } from "@/lib/auth/roles";
import { hasAdminAccess } from "@/lib/auth/roles";

interface NavShellProps {
  user: { name: string; username: string; role: AppRole };
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
  const moreLinks = hasAdminAccess(user.role) ? MORE_LINKS_ADMIN : MORE_LINKS_STAFF;
  const primaryLinks = hasAdminAccess(user.role)
    ? [COMMON_PRIMARY_LINKS[0], COMMON_PRIMARY_LINKS[1], { href: "/students", label: "Students", icon: Users }, COMMON_PRIMARY_LINKS[2]]
    : [COMMON_PRIMARY_LINKS[0], COMMON_PRIMARY_LINKS[1], { href: "/leaves", label: "Leaves", icon: CalendarX }, COMMON_PRIMARY_LINKS[2]];
  const insightLinks = moreLinks.filter((link) => link.href === "/reports");
  const managementLinks = moreLinks.filter((link) => link.href !== "/reports");
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
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#D9E4F0] bg-[#F4F7FB] md:sticky md:top-0 md:flex md:h-screen dark:border-neutral-800 dark:bg-[#11131b]">
          <div className="relative flex h-[4.75rem] items-center gap-3 overflow-hidden border-b border-white/10 bg-[#163B69] px-5 text-white dark:bg-[#122B49]">
            <span aria-hidden="true" className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/[0.06] to-transparent" />
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-[#B4233A] text-[11px] font-black tracking-tight text-white shadow-sm shadow-black/10">
              MMC
            </span>
            <span className="relative min-w-0"><span className="block truncate text-[13px] font-bold tracking-tight">Intern Attendance</span><span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-white/65">Maharajgunj Medical Campus</span></span>
          </div>

          <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3.5 py-5">
            <SidebarSection title="Workspace" links={primaryLinks} pathname={pathname} />
            {insightLinks.length > 0 && <SidebarSection title="Insights" links={insightLinks} pathname={pathname} />}
            {managementLinks.length > 0 && <SidebarSection title="Administration" links={managementLinks} pathname={pathname} />}
          </nav>

          <div className="mt-auto shrink-0 border-t border-[#DCE6F1] bg-[#EAF0F8] p-3.5 dark:border-neutral-800 dark:bg-[#0e1017]">
            <div className="rounded-xl border border-[#D8E3EF] bg-white p-2.5 shadow-sm shadow-[#0F3157]/[0.06] dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4F91] text-xs font-bold text-white shadow-sm shadow-[#1E4F91]/20 dark:bg-[#315F95]">
                {initials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {user.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                  @{user.username}
                </p>
              </div>
              <button type="button" onClick={toggleTheme} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} title={isDark ? "Switch to light theme" : "Switch to dark theme"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-[#B8CCE2] hover:bg-[#F5F8FC] hover:text-[#163B69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1E4F91] dark:text-[#A9C5EA]" aria-hidden="true" />
                <span className="text-[10px] font-semibold capitalize text-neutral-600 dark:text-neutral-300">{user.role === "superadmin" ? "Super Admin" : user.role}</span>
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Authorized</span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#CCDCEC] bg-white px-3 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-[#1E4F91]/35 hover:bg-[#F8FAFD] hover:text-[#163B69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <Settings className="h-3.5 w-3.5 text-[#1E4F91]/75 dark:text-[#A9C5EA]" />
                Account settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200/80 bg-white text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:border-red-950 dark:bg-neutral-900 dark:text-red-300 dark:hover:bg-red-950/40"
                aria-label={loggingOut ? "Logging out" : "Log out"}
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#DCE6F1] bg-[#F4F7FB]/95 px-4 backdrop-blur-md md:hidden dark:border-[#24364D] dark:bg-[#111B2A]/95">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 px-1.5 items-center justify-center rounded-md bg-[#B4233A] text-[10px] font-black tracking-normal text-white">
              MMC
            </span>
            <span className="text-xs font-bold tracking-tight text-[#163B69] dark:text-neutral-100">
              Attendance
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#47698F] transition-colors hover:bg-[#E7EEF7] hover:text-[#163B69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Toggle profile menu"
              className="flex h-9 items-center gap-1 rounded-full border border-[#D5E1EF] bg-white/90 py-1 pl-1 pr-2 text-xs font-bold text-[#1E4F91] shadow-sm transition-colors hover:border-[#B8CCE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-[#A9C5EA] dark:hover:bg-neutral-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E4F91]/10 dark:bg-[#1E4F91]/20">{initials(user.name)}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

            {/* Mobile Header Dropdown Popover */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 animate-in fade-in slide-in-from-top-2 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30">
                <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E4F91]/10 text-xs font-bold text-[#1E4F91] dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]">{initials(user.name)}</span>
                  <div className="min-w-0"><p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</p><p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">@{user.username}</p></div>
                </div>
                <div className="px-4 py-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F91]/[0.07] px-2 py-1 text-[10px] font-semibold capitalize text-[#1E4F91] dark:bg-[#1E4F91]/15 dark:text-[#A9C5EA]"><ShieldCheck className="h-3 w-3" />{user.role === "superadmin" ? "Super admin" : user.role} account</span></div>
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
        <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-white/10 bg-[#163B69] px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,49,87,0.16)] md:hidden dark:border-white/10 dark:bg-[#102B4B]">
          {primaryLinks.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                  active
                    ? "text-white"
                    : "text-white/65 hover:text-white/90"
                }`}
              >
                {active && <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[#D76A78]" />}
                <span className={`flex h-7 w-9 items-center justify-center rounded-lg transition-colors ${active ? "bg-white/12" : ""}`}>
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
              moreActive
                ? "text-white"
                : "text-white/65 hover:text-white/90"
            }`}
          >
            {moreActive && <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[#D76A78]" />}
            <span className={`flex h-7 w-9 items-center justify-center rounded-lg transition-colors ${moreActive ? "bg-white/12" : ""}`}>
              <MoreHorizontal className="h-[17px] w-[17px]" />
            </span>
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
                      ? "bg-[#1E4F91]/10 text-[#1E4F91] dark:bg-[#1E4F91]/20 dark:text-[#A9C5EA]"
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

function SidebarSection({
  title,
  links,
  pathname,
}: {
  title: string;
  links: Array<{ href: string; label: string; icon: LucideIcon }>;
  pathname: string;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center gap-2 px-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">{title}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[#DCE6F1] dark:bg-neutral-800" />
      </div>
      <div className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-h-10 items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] ${active ? "bg-[#1E4F91] text-white shadow-sm shadow-[#0F3157]/20 dark:bg-[#315F95]" : "text-neutral-700 hover:bg-white hover:text-[#163B69] dark:text-neutral-300 dark:hover:bg-neutral-800/80 dark:hover:text-white"}`}
            >
              {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-white/90" />}
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? "bg-white/15 text-white" : "bg-[#1E4F91]/[0.06] text-[#1E4F91]/80 group-hover:bg-[#1E4F91]/10 group-hover:text-[#163B69] dark:bg-[#A9C5EA]/[0.08] dark:text-[#A9C5EA]/80 dark:group-hover:bg-[#A9C5EA]/[0.14]"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white/90" />}
            </Link>
          );
        })}
      </div>
    </section>
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
