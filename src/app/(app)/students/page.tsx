import { requireAdminPage } from "@/lib/auth/page-guards";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { listStudents } from "@/lib/db/queries/students";
import { Card } from "@/components/card";
import { StudentsManager } from "./students-manager";

export default async function StudentsPage() {
  await requireAdminPage();
  const batch = await getCurrentBatch();
  const students = batch ? await listStudents(batch.id) : [];

  if (!batch) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No current batch is set.</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Create a batch on the Batches page first, then add students here.
        </p>
      </Card>
    );
  }

  return <StudentsManager batchName={batch.name} initialStudents={students} />;
}
