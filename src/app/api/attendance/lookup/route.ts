import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseQuery } from "@/lib/api";
import { lookupForAttendance } from "@/lib/attendance/service";
import { todayISO } from "@/lib/date";
import { lookupQuerySchema } from "@/lib/validation/attendance";

export async function GET(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), lookupQuerySchema);
  if (!query.ok) return query.response;

  try {
    const result = await lookupForAttendance(query.data.roll, query.data.date ?? todayISO());
    return result.ok ? NextResponse.json(result.data) : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
