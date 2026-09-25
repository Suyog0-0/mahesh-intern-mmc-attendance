"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, UserRound, LockKeyhole, ArrowRight } from "lucide-react";

function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Invalid username or password");
        setPending(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="login-enter w-full max-w-[25rem]">
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#B4233A] text-sm font-black tracking-wide text-white shadow-sm shadow-[#B4233A]/20">MMC</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1E4F91] dark:text-[#A9C5EA]">MMC · Intern Services</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Attendance management</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.28)] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">Secure sign in</p>
          <h1 className="mt-2 text-[1.65rem] font-bold tracking-tight text-neutral-950 dark:text-neutral-50">Welcome back</h1>
          <p className="mt-1.5 text-sm leading-5 text-neutral-500 dark:text-neutral-400">Sign in to continue to your attendance workspace.</p>
        </div>

        {error && (
          <div
            role="alert"
            className="login-error mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium leading-5 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <label htmlFor="username" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Username
        </label>
        <div className="login-field mt-2 flex h-12 items-center gap-3 rounded-lg border border-neutral-300/90 bg-white px-3.5 transition-all focus-within:border-[#1E4F91] focus-within:ring-4 focus-within:ring-[#1E4F91]/[0.09] dark:border-neutral-700 dark:bg-neutral-950 dark:focus-within:border-[#84AEE4]">
          <UserRound className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={username}
            onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
            placeholder="Enter your username"
            aria-invalid={!!error}
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-neutral-900 outline-none placeholder:text-sm placeholder:text-neutral-400 focus:ring-0 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>

        <label htmlFor="password" className="mt-5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Password
        </label>
        <div className="login-field mt-2 flex h-12 items-center gap-3 rounded-lg border border-neutral-300/90 bg-white px-3.5 transition-all focus-within:border-[#1E4F91] focus-within:ring-4 focus-within:ring-[#1E4F91]/[0.09] dark:border-neutral-700 dark:bg-neutral-950 dark:focus-within:border-[#84AEE4]">
          <LockKeyhole className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            required
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
            placeholder="Enter your password"
            aria-invalid={!!error}
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-neutral-900 outline-none placeholder:text-sm placeholder:text-neutral-400 focus:ring-0 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          Your account is protected with secure sign-in.
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1E4F91] px-4 text-sm font-semibold text-white shadow-sm shadow-[#1E4F91]/15 transition-all hover:bg-[#163B69] active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4F91]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:hover:bg-[#477DB9]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
          )}
        </button>
      </form>
      <p className="mt-5 text-center text-[11px] text-neutral-400 dark:text-neutral-500">For authorized MMC staff and administrators.</p>
    </div>
  );
}
