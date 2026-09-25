import { requirePageSession } from "@/lib/auth/page-guards";
import { getBatchOrCurrent, getBatchSummary } from "@/lib/attendance/service";
import { listBatches } from "@/lib/db/queries/batches";
import { Card } from "@/components/card";
import { ReportView } from "./report-view";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string; from?: string; to?: string }>;
}) {
  await requirePageSession();
  const { batchId: rawBatchId, from, to } = await searchParams;
  const batchId = rawBatchId && /^\d+$/.test(rawBatchId) ? Number(rawBatchId) : undefined;

  const [batch, allBatches] = await Promise.all([getBatchOrCurrent(batchId), listBatches()]);
  if (!batch) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-medium">No batches exist yet.</p>
      </Card>
    );
  }

  const summary = await getBatchSummary(batch, from, to);
  return (
    <ReportView
      batches={allBatches.map((b) => ({ id: b.id, name: b.name }))}
      batchId={batch.id}
      summary={summary}
    />
  );
}
