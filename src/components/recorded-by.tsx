import { UserRound } from "lucide-react";

export function RecordedBy({ name }: { name: string | null }) {
  const formerAccount = name === null;

  return (
    <span
      className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-50/80 px-2 py-1 dark:border-neutral-700/80 dark:bg-neutral-800/70"
      aria-label={`Recorded by ${name ?? "Former account"}`}
    >
      <UserRound className="h-3 w-3 shrink-0 text-[#1E4F91]/75 dark:text-[#A9C5EA]" aria-hidden="true" />
      <span className="shrink-0 text-[9px] font-medium text-neutral-500 dark:text-neutral-400">Recorded by</span>
      <span className={`truncate text-[10px] font-semibold ${formerAccount ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-800 dark:text-neutral-200"}`}>
        {name ?? "Former account"}
      </span>
    </span>
  );
}
