import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody } from "@/lib/api";
import { updateUser, deleteUser, getUserRoleById } from "@/lib/db/queries/users";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  role: z.enum(["admin", "staff", "superadmin"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId < 1) {
    return jsonError("Invalid user ID", 400);
  }

  const body = await parseBody(request, updateUserSchema);
  if (!body.ok) return body.response;

  const targetRole = await getUserRoleById(userId);
  if (!targetRole) return jsonError("User not found", 404);
  if (targetRole === "superadmin") return jsonError("Super-admin accounts are view-only", 403);
  if (body.data.role === "superadmin") return jsonError("Create a new super-admin account instead of changing an account's role", 400);

  try {
    const updated = await updateUser(userId, body.data);
    if (!updated) {
      const currentRole = await getUserRoleById(userId);
      if (currentRole === "superadmin") return jsonError("Super-admin accounts are view-only", 403);
      return jsonError("User not found", 404);
    }
    return NextResponse.json({ user: updated });
  } catch (error) {
    if (
      error instanceof Error &&
      "cause" in error &&
      /unique/i.test(String((error.cause as { message?: string } | undefined)?.message))
    ) {
      return jsonError("That username is already taken", 409);
    }
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId < 1) {
    return jsonError("Invalid user ID", 400);
  }

  // Prevent deleting yourself
  if (auth.data.userId === userId) {
    return jsonError("You cannot delete your own account", 400);
  }

  const targetRole = await getUserRoleById(userId);
  if (!targetRole) return jsonError("User not found", 404);
  if (targetRole === "superadmin") return jsonError("Super-admin accounts cannot be deleted", 403);

  try {
    const removed = await deleteUser(userId);
    if (!removed) {
      const currentRole = await getUserRoleById(userId);
      if (currentRole === "superadmin") return jsonError("Super-admin accounts cannot be deleted", 403);
      return jsonError("User not found", 404);
    }
    return NextResponse.json({ removed: true });
  } catch (error) {
    return handleError(error);
  }
}
