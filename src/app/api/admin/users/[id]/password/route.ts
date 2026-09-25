import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody, parseParams } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { getUserRoleById, updateUserPasswordHash } from "@/lib/db/queries/users";
import { idStringSchema } from "@/lib/validation/common";
import { resetPasswordSchema } from "@/lib/validation/users";
import { z } from "zod";

const paramsSchema = z.object({ id: idStringSchema });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;
  const body = await parseBody(request, resetPasswordSchema);
  if (!body.ok) return body.response;

  const userId = Number(parsedParams.data.id);
  const targetRole = await getUserRoleById(userId);
  if (!targetRole) return jsonError("User not found", 404);
  if (targetRole === "superadmin") return jsonError("Super-admin accounts are view-only", 403);

  try {
    const passwordHash = await hashPassword(body.data.password);
    const updated = await updateUserPasswordHash(userId, passwordHash);
    return updated ? NextResponse.json({ success: true }) : jsonError("User not found", 404);
  } catch (error) {
    return handleError(error);
  }
}
