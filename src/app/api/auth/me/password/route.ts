import { NextRequest, NextResponse } from "next/server";
import { authorize, jsonError, handleError } from "@/lib/api";
import { updateOwnPasswordHash } from "@/lib/db/queries/users";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function PATCH(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const updated = await updateOwnPasswordHash(auth.data.userId, passwordHash);
    if (!updated) return jsonError("User not found", 404);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
