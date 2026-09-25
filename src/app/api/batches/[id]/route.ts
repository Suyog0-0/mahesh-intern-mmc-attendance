import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody, parseParams } from "@/lib/api";
import { editBatch } from "@/lib/roster/service";
import { getBatchById, deleteBatch } from "@/lib/db/queries/batches";
import { idStringSchema } from "@/lib/validation/common";
import { updateBatchSchema } from "@/lib/validation/batches";
import { z } from "zod";

const paramsSchema = z.object({ id: idStringSchema });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;
  const body = await parseBody(request, updateBatchSchema);
  if (!body.ok) return body.response;

  try {
    const result = await editBatch(parsedParams.data.id, body.data);
    return result.ok
      ? NextResponse.json({ batch: result.data })
      : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;

  const id = parsedParams.data.id;

  try {
    const batch = await getBatchById(id);
    if (!batch) return jsonError("Batch not found", 404);
    if (batch.isCurrent) return jsonError("Cannot delete the currently active batch", 409);
    const removed = await deleteBatch(id);
    if (!removed) return jsonError("Batch not found", 404);
    return NextResponse.json({ removed: true });
  } catch (error) {
    return handleError(error);
  }
}
