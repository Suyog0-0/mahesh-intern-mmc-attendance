import { z } from "zod";
import { APP_ROLES } from "@/lib/auth/roles";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(64)
    .regex(/^[a-z0-9._-]+$/, "Use letters, numbers, dot, dash or underscore"),
  password: passwordSchema,
  name: z.string().trim().min(1, "Name is required").max(128),
  role: z.enum(APP_ROLES),
});

export const resetPasswordSchema = z.object({ password: passwordSchema });
