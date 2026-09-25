import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody, parseParams } from "@/lib/api";
import { editLeave, removeLeave } from "@/lib/roster/service";
import { idStringSchema } from "@/lib/validation/common";
import { z } from "zod";

const paramsSchema = z.object({ id: idStringSchema });
const updateSchema = z.object({ startDate: z.string().date(), endDate: z.string().date(), reason: z.string().max(1000).nullable() }).refine((value) => value.endDate >= value.startDate, { message: "End date must be on or after the start date", path: ["endDate"] });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;
  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;
  const body = await parseBody(request, updateSchema);
  if (!body.ok) return body.response;
  try {
    const result = await editLeave(parsedParams.data.id, body.data);
    return result.ok ? NextResponse.json({ leave: result.data }) : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}

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
