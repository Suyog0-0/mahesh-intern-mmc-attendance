import { z } from "zod";
import { isISODate, isMonthString } from "@/lib/date";
import { ATTENDANCE_STATUSES } from "@/lib/attendance/types";

export const isoDateSchema = z
  .string()
  .refine(isISODate, "Must be a valid date (YYYY-MM-DD)");

export const monthSchema = z
  .string()
  .refine(isMonthString, "Must be a valid month (YYYY-MM)");

export const idSchema = z.number().int().positive();

/** For ids that arrive as strings (URL params / query strings). */
export const idStringSchema = z
  .string()
  .regex(/^\d+$/, "Must be a positive integer")
  .transform(Number)
  .pipe(idSchema);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export const attendanceDepartmentSchema = z.enum([
  "cardiology",
  "dermatology",
  "psychiatry",
  "other",
]);
export const rollNumberSchema = z.string().trim().min(1, "Roll number is required").max(16);
