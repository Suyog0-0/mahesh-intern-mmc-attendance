import { requirePageSession } from "@/lib/auth/page-guards";
import { getCurrentBatch } from "@/lib/db/queries/batches";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const session = await requirePageSession();
  const currentBatch = await getCurrentBatch();

  return (
    <SettingsView
      session={session}
      currentBatch={
        currentBatch
          ? {
              name: currentBatch.name,
              startDate: currentBatch.startDate,
              endDate: currentBatch.endDate,
            }
          : undefined
      }
    />
  );
}
