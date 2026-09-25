import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody, parseQuery } from "@/lib/api";
import { getBatchOrCurrent, getAttendanceDay, clearAttendance, markAttendance } from "@/lib/attendance/service";
import { clearAttendanceQuerySchema, markAttendanceSchema } from "@/lib/validation/attendance";
import { idStringSchema, isoDateSchema } from "@/lib/validation/common";
import { z } from "zod";

const listQuerySchema = z.object({
  date: isoDateSchema,
  batchId: idStringSchema.optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), listQuerySchema);
  if (!query.ok) return query.response;

  try {
    const batch = await getBatchOrCurrent(query.data.batchId);
    if (!batch) return jsonError("No current batch is set", 409);
    return NextResponse.json({
      date: query.data.date,
      records: await getAttendanceDay(batch.id, query.data.date),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, markAttendanceSchema);
  if (!body.ok) return body.response;

  try {
    const result = await markAttendance({ ...body.data, userId: auth.data.userId });
    return result.ok
      ? NextResponse.json({ record: result.data })
      : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), clearAttendanceQuerySchema);
  if (!query.ok) return query.response;

  try {
    const result = await clearAttendance(query.data.studentId, query.data.date);
    return result.ok ? NextResponse.json(result.data) : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
