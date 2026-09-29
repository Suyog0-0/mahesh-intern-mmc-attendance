import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "destructive" | "warning" | "info" | "success" }> = {
  absent: { label: "Absent", variant: "destructive" },
  late: { label: "Late", variant: "warning" },
  leave: { label: "Leave", variant: "info" },
  present: { label: "Present", variant: "success" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant} className="gap-1.5 px-2.5 py-1 tracking-tight"><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />{config.label}</Badge>;
}
