import React from "react";

const STYLES: Record<string, { bg: string; dot: string; text: string }> = {
  absent: {
    bg: "bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
  },
  late: {
    bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40",
    dot: "bg-amber-500",
    text: "text-amber-800 dark:text-amber-300",
  },
  leave: {
    bg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  present: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
};

const LABEL: Record<string, string> = {
  absent: "Absent",
  late: "Late",
  leave: "Leave",
  present: "Present",
};

export function StatusBadge({ status }: { status: string }) {
  const conf = STYLES[status] ?? STYLES.present;
  const label = LABEL[status] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-tight ${conf.bg} ${conf.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
