import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDoc, insertDoc, updateDoc, serializeDoc } from "@/lib/firebase/db";
import { FieldValue } from "firebase-admin/firestore";
import { logActivity } from "@/lib/activity-log";

/**
 * POST /api/campaign-applications/[id]/accept
 *
 * Orchestrates the full accept flow:
 * 1. Fetch the application
 * 2. Create client
 * 3. Create project
 * 4. Assign team member (optional)
 * 5. Update application status
 * 6. Log activity
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  try {
    // Step 1: Fetch the application
    const application = await getDoc("campaign_applications", id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.status !== "pending") {
      return NextResponse.json(
        { error: `Application already ${application.status}` },
        { status: 400 }
      );
    }

    // Step 2: Create client
    const serviceTypes = Array.isArray(application.service_types)
      ? application.service_types
      : [];

    const client = await insertDoc("clients", {
      company_name: application.business_name,
      contact_person: application.full_name,
      email: application.email,
      phone: application.phone ?? null,
      country: application.location ?? null,
      status: "Active",
      notes: `Campaign: ${application.campaign_id ?? "spark10"}. ${
        body.internal_notes ?? application.internal_notes ?? ""
      }`.trim(),
      deleted_at: null,
    });

    // Step 3: Create project
    const projectTitle =
      typeof body.project_title === "string" && body.project_title.trim()
        ? body.project_title.trim()
        : `${application.business_name} — ${serviceTypes[0] ?? "Campaign Project"}`;

    const project = await insertDoc("projects", {
      project_name: projectTitle,
      client_id: client.id,
      client_name: application.business_name,
      service_type: serviceTypes.join(", "),
      status: "Planning",
      description: application.project_brief ?? "",
      deadline: body.expected_delivery ?? null,
      progress: 0,
    });

    // Step 4: Assign team member if provided
    if (body.assigned_member_id) {
      await insertDoc("work_item_assignments", {
        work_item_id: null,
        project_id: project.id,
        member_id: body.assigned_member_id,
        role_on_item: "lead",
        assigned_by: userId,
        assigned_at: new Date().toISOString(),
      });
    }

    // Step 5: Update application status
    const updatedApplication = await updateDoc("campaign_applications", id, {
      status: "accepted",
      assigned_client_id: client.id,
      assigned_project_id: project.id,
      reviewed_by: userId,
      reviewed_at: FieldValue.serverTimestamp(),
      internal_notes: body.internal_notes ?? application.internal_notes ?? null,
    });

    // Step 6: Log activity
    await logActivity({
      userId,
      action: "Accepted",
      entityType: "campaign_application",
      entityId: id,
      details: {
        target_name: application.business_name as string,
        client_id: client.id,
        project_id: project.id,
      },
    });

    return NextResponse.json({
      application: updatedApplication ? serializeDoc(updatedApplication) : null,
      client: serializeDoc(client),
      project: serializeDoc(project),
    });
  } catch (error) {
    console.error("Failed to accept application:", error);
    return NextResponse.json({ error: "Failed to accept application" }, { status: 500 });
  }
}
