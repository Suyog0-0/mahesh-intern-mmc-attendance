import { Card } from "@/components/ui/card";

export { Card };

export function StatTile({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: string;
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold tracking-tight ${tone ?? "text-foreground"}`}>{value}</span>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </Card>
  );
}
