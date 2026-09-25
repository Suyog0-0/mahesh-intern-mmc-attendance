import {
  createBatch,
  getBatchById,
  getCurrentBatch,
  setCurrentBatch,
  updateBatch,
  type Batch,
} from "@/lib/db/queries/batches";
import {
  createStudent,
  deleteStudentWithRecords,
  findStudentByRoll,
  getStudentById,
  updateStudent,
  type Student,
} from "@/lib/db/queries/students";
import { createLeave, deleteLeave, type Leave } from "@/lib/db/queries/leaves";
import { fail, ok, type Result } from "@/lib/result";

// Shared business logic for admin-managed data: batches, students, leaves.

// ---------------------------------------------------------------- batches

export async function addBatch(input: {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}): Promise<Result<Batch>> {
  return ok(await createBatch(input));
}

export async function editBatch(
  id: number,
  patch: { name?: string; startDate?: string; endDate?: string; isCurrent?: true },
): Promise<Result<Batch>> {
  const existing = await getBatchById(id);
  if (!existing) return fail(404, "Batch not found");

  const start = patch.startDate ?? existing.startDate;
  const end = patch.endDate ?? existing.endDate;
  if (end < start) return fail(400, "End date must be on or after the start date");

  const { isCurrent, ...fields } = patch;
  let batch = (await updateBatch(id, fields)) ?? existing;
  if (isCurrent && !existing.isCurrent) batch = await setCurrentBatch(id);
  return ok(batch);
}

// --------------------------------------------------------------- students

export async function addStudent(input: {
  batchId?: number;
  rollNumber: string;
  name: string;
  postingPeriod: string;
  remarks: string | null;
}): Promise<Result<Student>> {
  const batch = input.batchId ? await getBatchById(input.batchId) : await getCurrentBatch();
  if (!batch) {
    return fail(409, input.batchId ? "Batch not found" : "Create a batch and mark it current first");
  }
  if (await findStudentByRoll(batch.id, input.rollNumber)) {
    return fail(409, `Roll number ${input.rollNumber} already exists in this batch`);
  }
  return ok(
    await createStudent({
      batchId: batch.id,
      rollNumber: input.rollNumber,
      name: input.name,
      postingPeriod: input.postingPeriod,
      remarks: input.remarks,
    }),
  );
}

export async function editStudent(
  id: number,
  patch: {
    rollNumber?: string;
    name?: string;
    postingPeriod?: string;
    remarks?: string | null;
  },
): Promise<Result<Student>> {
  const existing = await getStudentById(id);
  if (!existing) return fail(404, "Student not found");
  if (patch.rollNumber && patch.rollNumber !== existing.rollNumber) {
    if (await findStudentByRoll(existing.batchId, patch.rollNumber)) {
      return fail(409, `Roll number ${patch.rollNumber} already exists in this batch`);
    }
  }
  const updated = await updateStudent(id, patch);
  return updated ? ok(updated) : fail(404, "Student not found");
}

export async function removeStudent(id: number): Promise<Result<{ deleted: true }>> {
  if (!(await getStudentById(id))) return fail(404, "Student not found");
  await deleteStudentWithRecords(id);
  return ok({ deleted: true });
}

// ----------------------------------------------------------------- leaves

export async function addLeave(input: {
  rollNumber: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdBy: number;
}): Promise<Result<Leave>> {
  const batch = await getCurrentBatch();
  if (!batch) return fail(409, "No current batch is set");
  const student = await findStudentByRoll(batch.id, input.rollNumber);
  if (!student) {
    return fail(404, `No student with roll number ${input.rollNumber} in the current batch`);
  }
  return ok(
    await createLeave({
      studentId: student.id,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      createdBy: input.createdBy,
    }),
  );
}

export async function removeLeave(id: number): Promise<Result<{ deleted: true }>> {
  return (await deleteLeave(id)) ? ok({ deleted: true }) : fail(404, "Leave not found");
}
