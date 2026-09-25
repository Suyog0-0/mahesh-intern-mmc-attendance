"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="inline-flex h-10 px-3 items-center justify-center rounded-xl bg-[#9E1B32] text-sm font-black tracking-normal text-white shadow-sm mb-3">
          MMC
        </span>
        <h1 className="text-2xl font-bold tracking-tight">
          Attendance Login
        </h1>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Sign in to access and manage intern attendance.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-[#9E1B32]/30 bg-[#9E1B32]/10 px-3.5 py-2.5 text-xs font-semibold text-[#9E1B32] dark:border-[#d4677c]/30 dark:bg-[#d4677c]/10 dark:text-[#e8a3b0]"
          >
            {error}
          </div>
        )}

        <label htmlFor="username" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. admin or staff"
          className="mt-1.5 w-full rounded-lg border border-neutral-300/80 bg-transparent px-3.5 py-2.5 text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-[#d4677c]"
        />

        <label htmlFor="password" className="mt-4 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-lg border border-neutral-300/80 bg-transparent pl-3.5 pr-10 py-2.5 text-xs text-neutral-900 outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-[#d4677c]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#7d1527] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#b82540]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}
