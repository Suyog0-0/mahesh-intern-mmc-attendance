import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";
import type { Result } from "@/lib/result";

// Small helpers that keep route handlers thin: authorize -> validate -> call
// shared logic -> respond.

type Role = "admin" | "staff";
export type Guard<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export function jsonError(message: string, status: number, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Server-side authorization for a route handler (never trust the client). */
export async function authorize(roles: Role[]): Promise<Guard<SessionPayload>> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError("Not authenticated", 401) };
  if (!roles.includes(session.role)) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }
  return { ok: true, data: session };
}

function validate<S extends z.ZodType>(
  schema: S,
  input: unknown,
): Guard<z.output<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    response: jsonError("Invalid request", 400, {
      details: z.flattenError(parsed.error),
    }),
  };
}

export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<Guard<z.output<S>>> {
  const body = await request.json().catch(() => null);
  return validate(schema, body);
}

export function parseQuery<S extends z.ZodType>(
  url: URL,
  schema: S,
): Guard<z.output<S>> {
  return validate(schema, Object.fromEntries(url.searchParams));
}

export function parseParams<S extends z.ZodType>(
  params: unknown,
  schema: S,
): Guard<z.output<S>> {
  return validate(schema, params);
}

function pgErrorCode(error: unknown): string | null {
  let cur: unknown = error;
  for (let i = 0; i < 4 && cur && typeof cur === "object"; i++) {
    const code = (cur as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    cur = (cur as { cause?: unknown }).cause;
  }
  return null;
}

/** Maps unexpected errors to safe responses; never leaks SQL or stack traces. */
export function handleError(error: unknown): NextResponse {
  const code = pgErrorCode(error);
  if (code === "23505") return jsonError("That record already exists", 409);
  if (code === "23503") {
    return jsonError("This record is still referenced by other records", 409);
  }
  console.error("Unhandled API error:", error);
  return jsonError("Something went wrong", 500);
}

/** Maps a business-logic Result to a JSON response. */
export function respond<T>(result: Result<T>, successStatus = 200): NextResponse {
  if (result.ok) return NextResponse.json(result.data, { status: successStatus });
  return jsonError(result.error, result.status);
}
