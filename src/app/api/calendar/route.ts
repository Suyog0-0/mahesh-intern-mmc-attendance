import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseQuery } from "@/lib/api";
import { getBatchOrCurrent, getCalendarMonth } from "@/lib/attendance/service";
import { idStringSchema } from "@/lib/validation/common";
import { monthSchema } from "@/lib/validation/common";
import { z } from "zod";

const querySchema = z.object({ month: monthSchema, batchId: idStringSchema.optional() });

export async function GET(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), querySchema);
  if (!query.ok) return query.response;

  try {
    const batch = await getBatchOrCurrent(query.data.batchId);
    if (!batch) return jsonError("No current batch is set", 409);
    return NextResponse.json({ days: await getCalendarMonth(batch, query.data.month) });
  } catch (error) {
    return handleError(error);
  }
}
