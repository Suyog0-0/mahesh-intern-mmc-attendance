import { z } from "zod";
import {
  attendanceStatusSchema,
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
  remarks: optionalText(1000),
});

export const clearAttendanceQuerySchema = z.object({
  studentId: idStringSchema,
  date: isoDateSchema,
});

export const lookupQuerySchema = z.object({
  roll: rollNumberSchema,
  date: isoDateSchema.optional(),
});
