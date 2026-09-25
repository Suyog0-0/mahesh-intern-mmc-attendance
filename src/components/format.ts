export function pct(part: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

export const STATUS_LABEL: Record<"absent" | "late" | "leave" | "present", string> = {
  absent: "Absent",
  late: "Late",
  leave: "Leave",
  present: "Present",
};

export const STATUS_DOT: Record<"absent" | "late" | "leave" | "present", string> = {
  absent: "bg-red-500",
  late: "bg-amber-500",
  leave: "bg-blue-500",
  present: "bg-emerald-500",
};
