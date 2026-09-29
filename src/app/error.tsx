"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      status="500"
      title="Something went wrong."
      description="The page couldn’t be loaded. You can try again, or return to the dashboard and continue from there."
      reference={error.digest}
      actions={(
        <>
          <Button type="button" onClick={retry} className="h-10 gap-2">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Go to dashboard
          </Link>
        </>
      )}
    />
  );
}
