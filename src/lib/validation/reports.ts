import { z } from "zod";
import { idStringSchema, isoDateSchema } from "./common";

export const reportQuerySchema = z.object({
  batchId: idStringSchema.optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});
