import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseParams } from "@/lib/api";
import { getStudentById } from "@/lib/db/queries/students";
import { getBatchById } from "@/lib/db/queries/batches";
import { getStudentSummary } from "@/lib/attendance/service";
import { idStringSchema } from "@/lib/validation/common";
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
    if (!student) return jsonError("Student not found", 404);

    const batch = await getBatchById(student.batchId);
    if (!batch) return jsonError("Batch not found", 404);

    const { summary, records, leaves } = await getStudentSummary(student, batch);

    return NextResponse.json({
      student,
      batch,
      summary,
      records,
      leaves,
    });
  } catch (error) {
    return handleError(error);
  }
}
