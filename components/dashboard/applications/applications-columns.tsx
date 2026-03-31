"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type CampaignApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name: string;
  business_type: string | null;
  location: string | null;
  service_types: string[];
  project_brief: string | null;
  has_existing_brand: boolean | null;
  timeline: string | null;
  referral_source: string | null;
  reference_links: string[] | null;
  agreed_to_terms: boolean;
  campaign_id: string;
  status: "pending" | "accepted" | "rejected";
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  assigned_client_id: string | null;
  assigned_project_id: string | null;
};

const statusStyles: Record<string, string> = {
  pending: "border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/10",
  accepted: "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10",
  rejected: "border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10",
};

export const applicationColumns: ColumnDef<CampaignApplication>[] = [
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-accent hover:text-foreground -ml-4"
      >
        Applicant
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.getValue("full_name")}</span>
        <a 
          href={`mailto:${row.original.email}`}
          className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline flex items-center gap-1 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="h-3 w-3" />
          {row.original.email}
        </a>
      </div>
    ),
  },
  {
    id: "business",
    accessorFn: (row) =>
      `${row.business_name}${row.business_type ? ` (${row.business_type})` : ""}`,
    header: "Business",
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.business_name}</span>
        {row.original.business_type && (
          <span className="text-muted-foreground text-xs ml-1">
            · {row.original.business_type}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "service_types",
    header: "Services",
    cell: ({ row }) => {
      const services = row.getValue("service_types") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {(services ?? []).map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="border-border text-xs font-normal"
            >
              {s}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.getValue("location") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "submitted_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-accent hover:text-foreground -ml-4"
      >
        Submitted
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const value = row.getValue("submitted_at") as string;
      if (!value) return <div>—</div>;
      try {
        return (
          <div className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(value), { addSuffix: true })}
          </div>
        );
      } catch {
        return <div>—</div>;
      }
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="outline"
          className={statusStyles[status] ?? "border-border text-muted-foreground"}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
];
