import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const encoder = new TextEncoder();

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return encoder.encode(secret);
}

export interface SessionPayload extends JWTPayload {
  userId: number;
  username: string;
  name: string;
  role: "admin" | "staff";
}

const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

export async function signSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "admin" && payload.role !== "staff")
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
