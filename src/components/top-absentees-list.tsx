"use client";

import { useStudentDrawer } from "@/components/student-drawer-context";
import { UserX } from "lucide-react";

interface Absentee {
  id: number;
  rollNumber: string;
  name: string;
  absentDays: number;
}

export function TopAbsenteesList({ absentees }: { absentees: Absentee[] }) {
  const { openStudent } = useStudentDrawer();

  if (absentees.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        No absences recorded yet for this batch.
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/60">
      {absentees.map((s) => (
        <li
          key={s.id}
          onClick={() => openStudent(s.id)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openStudent(s.id);
            }
          }}
          className="group flex cursor-pointer items-center justify-between py-2.5 text-xs transition-colors hover:text-[#1E4F91] first:pt-0 last:pb-0 dark:hover:text-[#A9C5EA]"
          title="Click to view full intern history"
        >
          <span className="min-w-0 truncate flex items-center gap-2">
            <UserX className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="font-mono font-medium text-neutral-400 group-hover:text-[#1E4F91] dark:group-hover:text-[#A9C5EA]">
              #{s.rollNumber}
            </span>{" "}
            <span className="font-semibold text-neutral-900 group-hover:text-[#1E4F91] dark:text-neutral-100 dark:group-hover:text-[#A9C5EA]">
              {s.name}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 transition-colors group-hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300">
            {s.absentDays} day{s.absentDays === 1 ? "" : "s"}
          </span>
        </li>
      ))}
    </ul>
  );
}
