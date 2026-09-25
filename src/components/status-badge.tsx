const STYLES: Record<string, string> = {
  absent: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  late: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  leave: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  present: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};
const LABEL: Record<string, string> = {
  absent: "Absent",
  late: "Late",
  leave: "Leave",
  present: "Present",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? STYLES.present}`}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
