import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ErrorState } from "@/components/error-state";

export default function NotFound() {
  return (
    <ErrorState
      status="404"
      title="We couldn’t find that page."
      description="The link may be outdated, or the address may have been entered incorrectly. Check it and try again, or return to the dashboard."
      actions={(
        <Link href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          Back to dashboard
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    />
  );
}
