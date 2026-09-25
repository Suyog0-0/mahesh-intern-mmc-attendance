import { z } from "zod";
import { isoDateSchema, optionalText, rollNumberSchema } from "./common";

export const createLeaveSchema = z
  .object({
    rollNumber: rollNumberSchema, // resolved inside the current batch
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    reason: optionalText(1000),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
