import { getDoc, queryDocs, serializeDoc } from "@/lib/firebase/db";
import { ApplicationReviewPanel } from "@/components/dashboard/applications/application-review-panel";
import { notFound } from "next/navigation";
import type { CampaignApplication } from "@/components/dashboard/applications/applications-columns";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationReviewPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch the application
  const doc = await getDoc("campaign_applications", id);
  if (!doc) notFound();

  const application = serializeDoc(doc) as unknown as CampaignApplication;

  // Fetch team members for the assign dropdown
  const teamData = await queryDocs(
    "users",
    [],
    [{ field: "first_name", direction: "asc" }]
  );

  const teamMembers = teamData.map((d) => ({
    id: d.id as string,
    first_name: (d.first_name as string) ?? "",
    last_name: (d.last_name as string) ?? "",
    email: (d.email as string) ?? "",
    role: (d.role as string) ?? null,
  }));

  return (
    <ApplicationReviewPanel
      application={application}
      teamMembers={teamMembers}
    />
  );
}
