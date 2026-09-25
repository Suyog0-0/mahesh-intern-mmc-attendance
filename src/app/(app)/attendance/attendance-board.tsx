"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { NepaliDateInput } from "@/components/nepali-date-input";
import { useStudentDrawer } from "@/components/student-drawer-context";
import { formatDate, todayISO } from "@/lib/date";
import type { DayListRow } from "@/lib/attendance/service";
import type { Student } from "@/lib/db/queries/students";
import { createSuccessAudioContext, useToast } from "@/components/toast-provider";
import { Search, CheckCircle2, UserX, Clock, CalendarX, Plus, Loader2, UserPlus, Stethoscope, HeartPulse, ScanFace, Brain, Hospital } from "lucide-react";
import type { AttendanceDepartment, AttendanceStatus } from "@/lib/attendance/types";
import { ATTENDANCE_DEPARTMENT_LABEL } from "@/lib/attendance/types";
import { RecordedBy } from "@/components/recorded-by";

type Status = AttendanceStatus;

const STATUS_CONFIG: {
  value: Status;
  label: string;
  icon: typeof UserX;
  colorCls: string;
}[] = [
  {
    value: "absent",
    label: "Absent",
    icon: UserX,
    colorCls:
      "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-900/40",
  },
  {
    value: "late",
    label: "Late",
    icon: Clock,
    colorCls:
      "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-900/40",
  },
  {
    value: "leave",
    label: "Leave",
    icon: CalendarX,
    colorCls:
      "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-900/40",
  },
];

const DEPARTMENT_CONFIG: {
  value: AttendanceDepartment;
  label: string;
  icon: typeof HeartPulse;
  iconColorCls: string;
}[] = [
  { value: "cardiology", label: "Cardiology", icon: HeartPulse, iconColorCls: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40" },
  { value: "dermatology", label: "Dermatology", icon: ScanFace, iconColorCls: "text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/40" },
  { value: "psychiatry", label: "Psychiatry", icon: Brain, iconColorCls: "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/40" },
  { value: "other", label: "Other", icon: Hospital, iconColorCls: "text-neutral-600 bg-neutral-100 dark:text-neutral-300 dark:bg-neutral-800" },
];

function DepartmentBadge({ department }: { department: AttendanceDepartment }) {
  const config = DEPARTMENT_CONFIG.find((item) => item.value === department)!;
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-[10px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
      <Icon className="h-3 w-3 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
      {config.label}
    </span>
  );
}

interface Props {
  batchName: string;
  date: string;
  initialRecords: DayListRow[];
  allStudents?: Student[];
}

type SelectedStudent = { id: number; rollNumber: string; name: string };

export function AttendanceBoard({
  batchName,
  date,
  initialRecords,
  allStudents = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoOpen = searchParams.get("openModal") === "true";

  const { openStudent } = useStudentDrawer();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [takeModalOpen, setTakeModalOpen] = useState(shouldAutoOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [activeStatusMarking, setActiveStatusMarking] = useState<Status | null>(null);
  const [confirmPresentFor, setConfirmPresentFor] = useState<DayListRow | null>(null);

  const [records, setRecords] = useState(initialRecords);
  const [prevInitialRecords, setPrevInitialRecords] = useState(initialRecords);

  if (initialRecords !== prevInitialRecords) {
    setPrevInitialRecords(initialRecords);
    setRecords(initialRecords);
  }

  const [isClearing, setIsClearing] = useState(false);

  const markedByStudentId = useMemo(
    () => new Map(records.map((r) => [r.studentId, r])),
    [records],
  );

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const filtered = allStudents.filter((s) => {
      if (markedByStudentId.get(s.id)?.status === "absent") return false;
      const r = s.rollNumber.toLowerCase();
      const n = s.name.toLowerCase();
      return r === q || r.startsWith(q) || n.includes(q);
    });

    return filtered
      .sort((a, b) => {
        const aR = a.rollNumber.toLowerCase();
        const bR = b.rollNumber.toLowerCase();
        if (aR === q && bR !== q) return -1;
        if (bR === q && aR !== q) return 1;
        if (aR.startsWith(q) && !bR.startsWith(q)) return -1;
        if (bR.startsWith(q) && !aR.startsWith(q)) return 1;
        return aR.localeCompare(bR, undefined, { numeric: true });
      })
      .slice(0, 8);
  }, [allStudents, markedByStudentId, searchQuery]);

  function changeDate(newDate: string) {
    startTransition(() => router.push(`/attendance?date=${newDate}`));
  }

  function handleSelectStudent(student: SelectedStudent) {
    setSelectedStudent(student);
  }

  async function mark(status: Status, department?: AttendanceDepartment) {
    if (!selectedStudent || activeStatusMarking) return;
    setActiveStatusMarking(status);
    const successAudio = createSuccessAudioContext();

    const targetStudent = selectedStudent;
    const previousRecords = [...records];

    setRecords((prev) => {
      const next = prev.filter((r) => r.studentId !== targetStudent.id);
      next.push({
        studentId: targetStudent.id,
        rollNumber: targetStudent.rollNumber,
        name: targetStudent.name,
        status,
        department: department ?? null,
        remarks: null,
        markedByName: "You",
        source: "record",
      });
      return next;
    });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: targetStudent.id,
          date,
          status,
          department: department ?? null,
          remarks: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecords(previousRecords);
        toast({ tone: "error", title: "Attendance was not updated", description: data.error ?? "Please try again." });
        if (successAudio) void successAudio.close();
        return;
      }
      setSelectedStudent(null);
      setSearchQuery("");
      toast({
        tone: status === "present" ? "present" : status === "absent" ? "absent" : status === "late" ? "late" : "leave",
        title: status === "present"
          ? `${targetStudent.name} present · ${department ? ATTENDANCE_DEPARTMENT_LABEL[department] : "Other"}`
          : `${targetStudent.name} marked ${status === "leave" ? "on leave" : status}.`,
        description: formatDate(date),
        soundContext: successAudio,
      });
      router.refresh();
    } catch {
      setRecords(previousRecords);
      toast({ tone: "error", title: "Network error", description: "Attendance could not be saved." });
      if (successAudio) void successAudio.close();
    } finally {
      setActiveStatusMarking(null);
    }
  }

  async function clearRecord(target: DayListRow) {
    if (isClearing) return;
    const studentId = target.studentId;
    const studentName = target.name;
    setIsClearing(true);
    const successAudio = createSuccessAudioContext();

    const previousRecords = [...records];
    setRecords((prev) => prev.filter((r) => r.studentId !== studentId));

    try {
      const res = await fetch(
        `/api/attendance?studentId=${studentId}&date=${date}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setRecords(previousRecords);
        toast({ tone: "error", title: "Could not mark present", description: "Please try again." });
        if (successAudio) void successAudio.close();
      } else {
        toast({
          tone: "present",
          title: `${studentName} marked present.`,
          description: formatDate(date),
          soundContext: successAudio,
        });
        router.refresh();
      }
    } catch {
      setRecords(previousRecords);
      toast({ tone: "error", title: "Network error", description: "The present status was not saved." });
      if (successAudio) void successAudio.close();
    } finally {
      setIsClearing(false);
    }
  }

  const sortedRecords = [...records].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }),
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Attendance Log
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Batch: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{batchName}</strong>
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:w-auto sm:flex sm:gap-3">
          <label className="min-w-0">
            <span className="sr-only">Attendance date (Bikram Sambat)</span>
            <NepaliDateInput
              value={date}
              max={todayISO()}
              onChange={changeDate}
              className="w-full sm:w-auto"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setSelectedStudent(null);
              setSearchQuery("");
              setTakeModalOpen(true);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1E4F91] px-2.5 py-2 text-[11px] font-semibold text-white shadow-2xs transition-colors hover:bg-[#12345D] focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:hover:bg-[#477DB9] sm:gap-2 sm:px-4 sm:text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Take Attendance</span>
          </button>
        </div>
      </div>

      {/* Main Records Container */}
      <Card className={isPending ? "opacity-60 transition-opacity" : ""}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1E4F91] dark:text-[#A9C5EA]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Attendance updates <span className="ml-1 font-medium tabular-nums text-neutral-500">({sortedRecords.length})</span></h2>
          </div>
          <span className="shrink-0 rounded-md bg-neutral-50 px-2.5 py-1.5 text-[11px] font-medium tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {formatDate(date)}
          </span>
        </div>

        {allStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 px-5 py-8 text-center dark:border-neutral-700 dark:bg-neutral-800/30">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add interns first</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-neutral-500 dark:text-neutral-400">There are no interns in this batch yet. Add interns before recording attendance.</p>
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/15">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">No exceptions today</p><p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-300/80">All {allStudents.length} interns are marked present for this date.</p></div>
              <span className="hidden rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 sm:inline-flex dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">Clear</span>
            </div>
          </div>
        ) : (
          <ul className="grid gap-2.5">
            {sortedRecords.map((r) => (
              <li
                key={r.studentId}
                onClick={() => openStudent(r.studentId)}
                className="group flex min-w-0 cursor-pointer flex-col gap-2 border-b border-neutral-100 px-1 py-3 text-xs transition-colors last:border-0 hover:bg-neutral-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] dark:border-neutral-800 dark:hover:bg-neutral-800/30 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-2"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openStudent(r.studentId);
                  }
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-semibold ${r.status === "absent" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300" : r.status === "late" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : r.status === "present" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"}`}>
                    #{r.rollNumber}
                  </span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-neutral-900 group-hover:text-[#1E4F91] dark:text-neutral-100 dark:group-hover:text-[#A9C5EA]">{r.name}</span><RecordedBy name={r.markedByName} /></span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-1.5 sm:shrink-0 sm:justify-end sm:gap-2">
                  <StatusBadge status={r.status} />
                  {r.department && <DepartmentBadge department={r.department} />}
                  {r.source === "record" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmPresentFor(r);
                      }}
                      disabled={isClearing}
                      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-wait disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200 sm:ml-0"
                      aria-label={`Mark ${r.name} present`}
                      title="Mark present"
                    >
                      {isClearing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={confirmPresentFor !== null}
        onOpenChange={(open) => {
          if (!open && !isClearing) setConfirmPresentFor(null);
        }}
        title="Confirm attendance update"
        description={confirmPresentFor ? `Are you sure you want to mark ${confirmPresentFor.name} present?` : undefined}
      >
        <Modal.Footer>
          <button
            type="button"
            onClick={() => setConfirmPresentFor(null)}
            disabled={isClearing}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirmPresentFor) return;
              const target = confirmPresentFor;
              setConfirmPresentFor(null);
              void clearRecord(target);
            }}
            disabled={isClearing}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50"
          >
            {isClearing && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Confirm present
          </button>
        </Modal.Footer>
      </Modal>

      {/* Take Attendance Modal */}
      <Modal
        open={takeModalOpen}
        onOpenChange={setTakeModalOpen}
        title="Take Attendance"
        description={`Record an attendance update for ${formatDate(date)}`}
      >
        <div className="flex flex-col gap-4 py-2">
          {!selectedStudent ? (
            <div className="relative">
              {allStudents.length === 0 && (
                <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200">
                  Add interns to this batch first. Attendance can be recorded after the batch has interns.
                </p>
              )}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search intern by roll number or name..."
                  className="w-full rounded-xl border border-neutral-300/80 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 outline-none transition-colors focus:border-[#1E4F91] focus:ring-2 focus:ring-[#1E4F91]/20 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
                  autoFocus
                />
              </div>

              {searchSuggestions.length > 0 && (
                <ul className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-neutral-200/90 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700/60">
                  {searchSuggestions.map((s) => {
                    const marked = markedByStudentId.get(s.id);
                    const isExactMatch = s.rollNumber.toLowerCase() === searchQuery.trim().toLowerCase();
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectStudent(s)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/60 ${isExactMatch ? 'bg-[#1E4F91]/10 dark:bg-[#A9C5EA]/10 border-l-2 border-[#1E4F91] dark:border-[#A9C5EA]' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[#1E4F91] dark:text-[#A9C5EA]">
                              #{s.rollNumber}
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {s.name}
                            </span>
                          </div>
                          {marked ? (
                            <span className="flex items-center gap-1.5"><StatusBadge status={marked.status} />{marked.department && <DepartmentBadge department={marked.department} />}</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#1E4F91] dark:text-[#A9C5EA]">
                              Mark →
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {searchQuery.trim() !== "" && searchSuggestions.length === 0 && (
                <p className="mt-4 text-center text-xs text-neutral-500">
                  No matching intern found.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                <div>
                  <span className="font-mono text-xs font-bold text-[#1E4F91] dark:text-[#A9C5EA]">
                    Roll #{selectedStudent.rollNumber}
                  </span>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-sm mt-0.5">
                    {selectedStudent.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {STATUS_CONFIG.map((opt) => {
                  const isLoadingThis = activeStatusMarking === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!!activeStatusMarking}
                      onClick={() => mark(opt.value)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all ${opt.colorCls} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                      <span>{isLoadingThis ? "Saving..." : opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <section aria-labelledby="present-elsewhere-heading" className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3 dark:border-neutral-700/80 dark:bg-neutral-900/50">
                <div className="mb-2.5 flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Stethoscope className="h-3.5 w-3.5" aria-hidden="true" /></span>
                  <div>
                    <h4 id="present-elsewhere-heading" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Present elsewhere</h4>
                    <p className="mt-0.5 text-[10px] leading-4 text-neutral-500 dark:text-neutral-400">Record the department without marking the intern absent.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENT_CONFIG.map((department) => {
                    const Icon = department.icon;
                    const isLoadingThis = activeStatusMarking === "present";
                    return (
                      <button
                        key={department.value}
                        type="button"
                        disabled={!!activeStatusMarking}
                        onClick={() => mark("present", department.value)}
                        className="group flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left text-[11px] font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                      >
                        {isLoadingThis ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-700" /> : <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${department.iconColorCls}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" /></span>}
                        <span className="truncate">{department.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          <Modal.Footer>
            <button
              type="button"
              onClick={() => setTakeModalOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Done
            </button>
          </Modal.Footer>
        </div>
      </Modal>

    </div>
  );
}
