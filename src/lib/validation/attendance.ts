import { z } from "zod";
import {
  attendanceStatusSchema,
  attendanceDepartmentSchema,
  idSchema,
  idStringSchema,
  isoDateSchema,
  optionalText,
  rollNumberSchema,
} from "./common";

export const markAttendanceSchema = z.object({
  studentId: idSchema,
  date: isoDateSchema,
  status: attendanceStatusSchema,
  department: attendanceDepartmentSchema.nullish(),
  remarks: optionalText(1000),
}).superRefine((value, context) => {
  if (value.status === "present" && !value.department) {
    context.addIssue({ code: "custom", path: ["department"], message: "Choose a department for this present record." });
  }
  if (value.status !== "present" && value.department) {
    context.addIssue({ code: "custom", path: ["department"], message: "A department can only be recorded for present elsewhere." });
  }
});

export const clearAttendanceQuerySchema = z.object({
  studentId: idStringSchema,
  date: isoDateSchema,
});

export const lookupQuerySchema = z.object({
  roll: rollNumberSchema,
  date: isoDateSchema.optional(),
});
