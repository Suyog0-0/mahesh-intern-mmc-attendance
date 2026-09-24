"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

// Only allow same-site relative paths to prevent open redirects.
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
        // The API returns one generic message for all auth failures
        // (per .clauderules login-security rules) — just surface it.
        setError(data?.error ?? "Invalid username or password");
        setPending(false);
        return;
      }

      // Cookie is set by the route handler; refresh so middleware sees it.
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9E1B32] dark:text-[#d4677c]">
          MMC
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Attendance Login
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to take and manage attendance.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-[#9E1B32]/30 bg-[#9E1B32]/10 px-3 py-2 text-sm text-[#9E1B32] dark:border-[#d4677c]/30 dark:bg-[#d4677c]/10 dark:text-[#e8a3b0]"
          >
            {error}
          </div>
        )}

        <label htmlFor="username" className="block text-sm font-medium">
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
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700 dark:focus:border-[#d4677c]"
        />

        <label htmlFor="password" className="mt-4 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/20 dark:border-neutral-700 dark:focus:border-[#d4677c]"
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7d1527] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#b82540]"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
