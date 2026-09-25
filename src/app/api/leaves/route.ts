import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody } from "@/lib/api";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { listLeavesForBatch } from "@/lib/db/queries/leaves";
import { addLeave } from "@/lib/roster/service";
import { createLeaveSchema } from "@/lib/validation/leaves";

export async function GET() {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  try {
    const batch = await getCurrentBatch();
    if (!batch) return jsonError("No current batch is set", 409);
    return NextResponse.json({ leaves: await listLeavesForBatch(batch.id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createLeaveSchema);
  if (!body.ok) return body.response;

  try {
    const result = await addLeave({ ...body.data, createdBy: auth.data.userId });
    return result.ok
      ? NextResponse.json({ leave: result.data }, { status: 201 })
      : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
