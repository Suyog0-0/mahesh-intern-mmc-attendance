import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CircleAlert, Compass, Home } from "lucide-react";

export function ErrorState({
  status,
  title,
  description,
  actions,
  reference,
}: {
  status: "404" | "500";
  title: string;
  description: string;
  actions: ReactNode;
  reference?: string;
}) {
  const isNotFound = status === "404";
  const Symbol = isNotFound ? Compass : CircleAlert;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <section aria-labelledby="error-title" className="w-full max-w-xl">
        <div className="rounded-2xl border border-border bg-card px-6 py-9 shadow-sm sm:px-10 sm:py-11">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground">
            <Activity aria-hidden="true" className="h-4 w-4 text-primary" />
            <span>MMC ATTENDANCE</span>
          </div>

          <div className="mt-9 flex items-center gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${isNotFound ? "bg-secondary text-primary" : "bg-destructive/10 text-destructive"}`}>
              <Symbol aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{isNotFound ? "Page not found" : "Application error"}</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">Error {status}</p>
            </div>
          </div>

          <h1 id="error-title" className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>

          {reference && <p className="mt-4 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">Reference: {reference}</p>}

          <div className="mt-7 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            {actions}
            <Link href="/login" className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Home aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Mahakali Medical College · Intern attendance</span>
        </div>
      </section>
    </main>
  );
}
