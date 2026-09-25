import { z } from "zod";
import { isISODate, isMonthString } from "@/lib/date";

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

export const attendanceStatusSchema = z.enum(["absent", "late", "leave"]);
export const rollNumberSchema = z.string().trim().min(1, "Roll number is required").max(16);
