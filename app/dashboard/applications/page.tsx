import { queryDocs, serializeDoc } from "@/lib/firebase/db";
import { ApplicationsDataTable } from "@/components/dashboard/applications/applications-data-table";
import type { CampaignApplication } from "@/components/dashboard/applications/applications-columns";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const data = await queryDocs(
    "campaign_applications",
    [],
    [{ field: "submitted_at", direction: "desc" }]
  );

  const applications = data.map((doc) =>
    serializeDoc(doc)
  ) as unknown as CampaignApplication[];

  return <ApplicationsDataTable initialData={applications} />;
}
