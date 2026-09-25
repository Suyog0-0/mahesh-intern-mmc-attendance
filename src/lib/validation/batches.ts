import { z } from "zod";
import { isoDateSchema } from "./common";

const name = z.string().trim().min(1, "Name is required").max(128);

export const createBatchSchema = z
  .object({
    name,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    isCurrent: z.boolean().optional().default(false),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const updateBatchSchema = z
  .object({
    name: name.optional(),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    // Only `true` is meaningful: a batch stops being current when another is set.
    isCurrent: z.literal(true).optional(),
  })
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    { message: "End date must be on or after the start date", path: ["endDate"] },
  );
