import { requirePageSession } from "@/lib/auth/page-guards";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { listLeavesForBatch } from "@/lib/db/queries/leaves";
import { listStudents } from "@/lib/db/queries/students";
import { Card } from "@/components/card";
import { LeavesManager } from "./leaves-manager";

export default async function LeavesPage() {
  await requirePageSession();
  const batch = await getCurrentBatch();
  const [leaves, students] = batch
    ? await Promise.all([listLeavesForBatch(batch.id), listStudents(batch.id)])
    : [[], []];

  if (!batch) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No current batch is set.</p>
      </Card>
    );
  }

  return <LeavesManager batchName={batch.name} initialLeaves={leaves} initialStudentCount={students.length} />;
}
