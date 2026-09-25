import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody, parseParams } from "@/lib/api";
import { getStudentById } from "@/lib/db/queries/students";
import { editStudent, removeStudent } from "@/lib/roster/service";
import { idStringSchema } from "@/lib/validation/common";
import { updateStudentSchema } from "@/lib/validation/students";
import { z } from "zod";

const paramsSchema = z.object({ id: idStringSchema });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;

  try {
    const student = await getStudentById(parsedParams.data.id);
    return student ? NextResponse.json({ student }) : jsonError("Student not found", 404);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.ok) return parsedParams.response;
  const body = await parseBody(request, updateStudentSchema);
  if (!body.ok) return body.response;

  try {
    const result = await editStudent(parsedParams.data.id, body.data);
    return result.ok
      ? NextResponse.json({ student: result.data })
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

  try {
    const result = await removeStudent(parsedParams.data.id);
    return result.ok ? NextResponse.json(result.data) : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
