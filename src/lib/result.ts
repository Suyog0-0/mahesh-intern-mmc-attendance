// Result type for shared business logic; route handlers map it to HTTP.
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (status: number, error: string): Result<never> => ({
  ok: false,
  status,
  error,
});
