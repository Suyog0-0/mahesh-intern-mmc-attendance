import { requireAdminPage } from "@/lib/auth/page-guards";
import { countStudentsByBatch, listBatches } from "@/lib/db/queries/batches";
import { BatchesManager } from "./batches-manager";

export default async function BatchesPage() {
  await requireAdminPage();
  const [batches, counts] = await Promise.all([listBatches(), countStudentsByBatch()]);
  const withCounts = batches.map((b) => ({ ...b, studentCount: counts.get(b.id) ?? 0 }));
  return <BatchesManager initialBatches={withCounts} />;
}
