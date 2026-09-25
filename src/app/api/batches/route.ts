import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody } from "@/lib/api";
import { countStudentsByBatch, listBatches } from "@/lib/db/queries/batches";
import { addBatch } from "@/lib/roster/service";
import { createBatchSchema } from "@/lib/validation/batches";

export async function GET() {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  try {
    const [batches, counts] = await Promise.all([listBatches(), countStudentsByBatch()]);
    return NextResponse.json({
      batches: batches.map((b) => ({ ...b, studentCount: counts.get(b.id) ?? 0 })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createBatchSchema);
  if (!body.ok) return body.response;

  try {
    const result = await addBatch(body.data);
    return result.ok
      ? NextResponse.json({ batch: result.data }, { status: 201 })
      : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
