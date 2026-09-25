import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseQuery } from "@/lib/api";
import { getBatchOrCurrent, getBatchSummary } from "@/lib/attendance/service";
import { reportQuerySchema } from "@/lib/validation/reports";

export async function GET(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), reportQuerySchema);
  if (!query.ok) return query.response;

  try {
    const batch = await getBatchOrCurrent(query.data.batchId);
    if (!batch) return jsonError("No current batch is set", 409);
    if (query.data.from && query.data.to && query.data.to < query.data.from) {
      return jsonError("`to` must be on or after `from`", 400);
    }
    return NextResponse.json({
      batch,
      summary: await getBatchSummary(batch, query.data.from, query.data.to),
    });
  } catch (error) {
    return handleError(error);
  }
}
