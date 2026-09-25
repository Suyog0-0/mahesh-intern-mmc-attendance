import { z } from "zod";
import { idSchema, optionalText, rollNumberSchema } from "./common";

export const createStudentSchema = z.object({
  batchId: idSchema.optional(), // defaults to the current batch
  rollNumber: rollNumberSchema,
  name: z.string().trim().min(1, "Name is required").max(128),
  postingPeriod: z.string().trim().min(1, "Posting period is required").max(128),
  remarks: optionalText(2000),
});

export const updateStudentSchema = z
  .object({
    rollNumber: rollNumberSchema.optional(),
    name: z.string().trim().min(1).max(128).optional(),
    postingPeriod: z.string().trim().min(1).max(128).optional(),
    remarks: optionalText(2000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });
