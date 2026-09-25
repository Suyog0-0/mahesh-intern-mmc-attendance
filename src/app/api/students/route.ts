import { NextRequest, NextResponse } from "next/server";
import { authorize, handleError, jsonError, parseBody, parseQuery } from "@/lib/api";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { listStudents } from "@/lib/db/queries/students";
import { addStudent } from "@/lib/roster/service";
import { idStringSchema } from "@/lib/validation/common";
import { createStudentSchema } from "@/lib/validation/students";
import { z } from "zod";

const listQuerySchema = z.object({
  batchId: idStringSchema.optional(),
  q: z.string().trim().max(128).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authorize(["admin", "staff"]);
  if (!auth.ok) return auth.response;

  const query = parseQuery(new URL(request.url), listQuerySchema);
  if (!query.ok) return query.response;

  const batch = query.data.batchId
    ? { id: query.data.batchId }
    : await getCurrentBatch();
  if (!batch) return jsonError("No current batch is set", 409);

  try {
    return NextResponse.json({ students: await listStudents(batch.id, query.data.q) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(["admin"]);
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createStudentSchema);
  if (!body.ok) return body.response;

  try {
    const result = await addStudent(body.data);
    return result.ok
      ? NextResponse.json({ student: result.data }, { status: 201 })
      : jsonError(result.error, result.status);
  } catch (error) {
    return handleError(error);
  }
}
