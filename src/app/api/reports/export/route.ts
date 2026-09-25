import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseQuery } from "@/lib/api";
import { getBatchOrCurrent, getBatchSummary } from "@/lib/attendance/service";
import { summaryToCsv } from "@/lib/attendance/csv";
import { reportQuerySchema } from "@/lib/validation/reports";

export async function GET(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), reportQuerySchema);
  if (!query.ok) return query.response;

  try {
    const batch = await getBatchOrCurrent(query.data.batchId);
    if (!batch) return jsonError("No current batch is set", 409);
    const summary = await getBatchSummary(batch, query.data.from, query.data.to);
    const csv = summaryToCsv(summary);
    const filename = `attendance-${batch.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${summary.from}-to-${summary.to}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
