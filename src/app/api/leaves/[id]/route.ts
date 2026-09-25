import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseParams } from "@/lib/api";
import { removeLeave } from "@/lib/roster/service";
import { idStringSchema } from "@/lib/validation/common";
import { z } from "zod";

const paramsSchema = z.object({ id: idStringSchema });

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;

  try {
    const result = await removeLeave(parsedParams.data.id);
    return result.ok ? NextResponse.json(result.data) : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
