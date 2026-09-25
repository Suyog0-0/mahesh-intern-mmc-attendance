import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-shadow dark:border-neutral-800/80 dark:bg-neutral-900/60 ${className}`}
    >
      {children}
    </div>
  );
}

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
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <span
        className={`text-2xl font-bold tracking-tight ${
          tone ?? "text-neutral-900 dark:text-neutral-50"
        }`}
      >
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </span>
      )}
    </Card>
  );
}
