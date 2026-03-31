import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDoc, updateDoc, serializeDoc } from "@/lib/firebase/db";
import { FieldValue } from "firebase-admin/firestore";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/campaign-applications/[id]
 * Returns a single campaign application by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const doc = await getDoc("campaign_applications", id);
    if (!doc) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    return NextResponse.json({ application: serializeDoc(doc) });
  } catch (error) {
    console.error("Failed to fetch application:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

/**
 * PATCH /api/campaign-applications/[id]
 *
 * Case 1 — Save notes / internal review:
 *   body: { internal_notes: string }
 *
 * Case 2 — Reject:
 *   body: { action: "reject", rejection_reason: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  try {
    // Case 2 — Reject
    if (body.action === "reject") {
      const rejectionReason = typeof body.rejection_reason === "string" ? body.rejection_reason.trim() : "";
      if (!rejectionReason) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      const updated = await updateDoc("campaign_applications", id, {
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_by: userId,
        reviewed_at: FieldValue.serverTimestamp(),
      });

      if (!updated) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      await logActivity({
        userId,
        action: "Rejected",
        entityType: "campaign_application",
        entityId: id,
        details: { target_name: updated.business_name as string },
      });

      return NextResponse.json({ application: serializeDoc(updated) });
    }

    // Case 1 — Save internal notes
    const updates: Record<string, unknown> = {};

    if (body.internal_notes !== undefined) {
      updates.internal_notes = typeof body.internal_notes === "string" ? body.internal_notes.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    updates.reviewed_by = userId;
    updates.reviewed_at = FieldValue.serverTimestamp();

    const updated = await updateDoc("campaign_applications", id, updates);
    if (!updated) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    await logActivity({
      userId,
      action: "Reviewed",
      entityType: "campaign_application",
      entityId: id,
      details: { target_name: updated.business_name as string },
    });

    return NextResponse.json({ application: serializeDoc(updated) });
  } catch (error) {
    console.error("Failed to update application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
