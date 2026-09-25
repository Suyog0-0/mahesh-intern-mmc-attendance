import { requireAdminPage } from "@/lib/auth/page-guards";
import { getCurrentBatch, listBatches } from "@/lib/db/queries/batches";
import { listStudents } from "@/lib/db/queries/students";
import { Card } from "@/components/card";
import { StudentsManager } from "./students-manager";

export default async function StudentsPage() {
  await requireAdminPage();
  const [currentBatch, allBatches] = await Promise.all([
    getCurrentBatch(),
    listBatches(),
  ]);

  if (!currentBatch && allBatches.length === 0) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No batch exists yet.</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Create a batch on the Batches page first, then add students here.
        </p>
      </Card>
    );
  }

  const activeBatch = currentBatch ?? allBatches[0];
  const students = await listStudents(activeBatch.id);

  return (
    <StudentsManager
      batchName={activeBatch.name}
      currentBatchId={activeBatch.id}
      batches={allBatches}
      initialStudents={students}
    />
  );
}
