import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryDocs, serializeDoc } from "@/lib/firebase/db";
import type { WhereFilter, OrderByClause } from "@/lib/firebase/db";

/**
 * GET /api/campaign-applications
 * Returns all campaign applications, optionally filtered by ?status=pending|accepted|rejected
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const filters: WhereFilter[] = [];
    if (statusFilter && ["pending", "accepted", "rejected"].includes(statusFilter)) {
      filters.push({ field: "status", op: "==", value: statusFilter });
    }

    const orderBy: OrderByClause[] = [{ field: "submitted_at", direction: "desc" }];

    const data = await queryDocs("campaign_applications", filters, orderBy);

    return NextResponse.json({
      applications: data.map((d) => serializeDoc(d)),
    });
  } catch (error) {
    console.error("Failed to fetch campaign applications:", error);
    return NextResponse.json({ error: "Failed to fetch campaign applications" }, { status: 500 });
  }
}
