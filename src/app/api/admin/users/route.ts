import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { createUser, listUsers } from "@/lib/db/queries/users";
import { createUserSchema } from "@/lib/validation/users";

// Note: middleware already restricts /api/admin/* to admins; authorize()
// here is defense-in-depth in case this route is ever reused elsewhere.

export async function GET() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ users: await listUsers() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createUserSchema);
  if (!body.ok) return body.response;
  if (body.data.role === "superadmin" && auth.data.role !== "superadmin") {
    return jsonError("Only a super admin can create super-admin accounts", 403);
  }

  try {
    const passwordHash = await hashPassword(body.data.password);
    const user = await createUser({ ...body.data, passwordHash });
    return NextResponse.json({ user }, { status: 201 });
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
