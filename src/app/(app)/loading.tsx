export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-neutral-200/80 dark:bg-neutral-800" />
      <div className="h-32 w-full rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 w-full rounded-xl bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-48 w-full rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    </div>
  );
}
