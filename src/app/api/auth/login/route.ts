import { NextRequest, NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getUserByUsername } from "@/lib/db/queries/users";
import { loginSchema } from "@/lib/validation/auth";

const INVALID = "Invalid username or password";

export async function POST(request: NextRequest) {
  const body = await parseBody(request, loginSchema);
  if (!body.ok) return body.response;
  const { username, password } = body.data;

  const user = await getUserByUsername(username);

  // Always run one bcrypt comparison so an unknown username and a wrong
  // password are indistinguishable (same response, same timing).
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !passwordOk) return jsonError(INVALID, 401);

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
}
