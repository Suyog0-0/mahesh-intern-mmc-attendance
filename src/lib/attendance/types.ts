export const ATTENDANCE_STATUSES = [
  "absent",
  "late",
  "leave",
  "present",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_DEPARTMENTS = [
  "cardiology",
  "dermatology",
  "psychiatry",
  "other",
] as const;

export type AttendanceDepartment = (typeof ATTENDANCE_DEPARTMENTS)[number];

export const ATTENDANCE_DEPARTMENT_LABEL: Record<AttendanceDepartment, string> = {
  cardiology: "Cardiology",
  dermatology: "Dermatology",
  psychiatry: "Psychiatry",
  other: "Other",
};
