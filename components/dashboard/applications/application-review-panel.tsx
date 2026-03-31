"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Link2,
  Sparkles,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import type { CampaignApplication } from "./applications-columns";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
}

interface ApplicationReviewPanelProps {
  application: CampaignApplication;
  teamMembers: TeamMember[];
}

const statusStyles: Record<string, string> = {
  pending: "border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/10",
  accepted: "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10",
  rejected: "border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10",
};

export function ApplicationReviewPanel({
  application: initialApplication,
  teamMembers,
}: ApplicationReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [application, setApplication] = useState(initialApplication);

  // Action form state
  const [internalNotes, setInternalNotes] = useState(
    application.internal_notes ?? ""
  );
  const [projectTitle, setProjectTitle] = useState(
    `${application.business_name} — ${
      application.service_types?.[0] ?? "Campaign Project"
    }`
  );
  const [assignedMemberId, setAssignedMemberId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");

  // Reject flow
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const isReviewed = application.status !== "pending";

  async function handleSaveNotes() {
    startTransition(async () => {
      const res = await fetch(`/api/campaign-applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internal_notes: internalNotes }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error ?? "Failed to save notes");
        return;
      }
      setApplication(payload.application);
      toast.success("Notes saved successfully");
    });
  }

  async function handleAccept() {
    if (!confirm("Accept this application? This will create a new client and project.")) return;

    startTransition(async () => {
      const res = await fetch(
        `/api/campaign-applications/${application.id}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_title: projectTitle,
            assigned_member_id: assignedMemberId || undefined,
            expected_delivery: expectedDelivery || undefined,
            internal_notes: internalNotes || undefined,
          }),
        }
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error ?? "Failed to accept application");
        return;
      }
      setApplication(payload.application);
      toast.success("Application accepted! Client and project created.");
      router.refresh();
    });
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/campaign-applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectionReason,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error ?? "Failed to reject application");
        return;
      }
      setApplication(payload.application);
      setShowRejectForm(false);
      toast.success("Application rejected.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-220px)]">
        {/* ─── Left Panel — Read Only ─── */}
        <div className="flex-1 border border-border bg-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-accent flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Application Details
            </h3>
            <Badge
              variant="outline"
              className={statusStyles[application.status] ?? ""}
            >
              {application.status.charAt(0).toUpperCase() +
                application.status.slice(1)}
            </Badge>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {application.full_name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <a
                    href={`mailto:${application.email}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {application.email}
                  </a>
                  {application.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {application.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Business Information
                </h4>
                <div className="space-y-3 bg-background p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">
                        {application.business_name}
                      </span>
                      {application.business_type && (
                        <span className="text-muted-foreground ml-1">
                          · {application.business_type}
                        </span>
                      )}
                    </div>
                  </div>
                  {application.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">
                        {application.location}
                      </span>
                    </div>
                  )}
                  {application.referral_source && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        Referral: {application.referral_source}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Services Requested
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(application.service_types ?? []).map((service) => (
                    <Badge
                      key={service}
                      variant="outline"
                      className="border-primary/30 text-primary bg-primary/5"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Project Brief */}
              {application.project_brief && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Project Brief
                  </h4>
                  <p className="text-sm text-foreground bg-background p-4 rounded-lg border border-border leading-relaxed whitespace-pre-wrap">
                    {application.project_brief}
                  </p>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Additional Details
                </h4>
                <div className="bg-background p-4 rounded-lg border border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Has Existing Brand
                    </span>
                    <span className="text-foreground">
                      {application.has_existing_brand ? "Yes" : "No"}
                    </span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeline</span>
                    <span className="text-foreground">
                      {application.timeline ?? "Not specified"}
                    </span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign</span>
                    <Badge variant="outline" className="text-xs">
                      {application.campaign_id}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Reference Links */}
              {application.reference_links &&
                application.reference_links.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Reference Links
                    </h4>
                    <div className="space-y-2">
                      {application.reference_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          {link}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* Submission Metadata */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Submission Info
                </h4>
                <div className="bg-background p-4 rounded-lg border border-border space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Submitted{" "}
                      {application.submitted_at
                        ? format(
                            new Date(application.submitted_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )
                        : "Unknown"}
                    </span>
                  </div>
                  {application.submitted_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatDistanceToNow(
                          new Date(application.submitted_at),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* If accepted, show linked entities */}
              {application.status === "accepted" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Linked Records
                  </h4>
                  <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 p-4 rounded-lg space-y-2">
                    {application.assigned_client_id && (
                      <Link
                        href="/dashboard/clients"
                        className="flex items-center gap-2 text-sm text-[#22c55e] hover:underline"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        View Client →
                      </Link>
                    )}
                    {application.assigned_project_id && (
                      <Link
                        href={`/dashboard/projects/${application.assigned_project_id}`}
                        className="flex items-center gap-2 text-sm text-[#22c55e] hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Project →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* If rejected, show reason */}
              {application.status === "rejected" &&
                application.rejection_reason && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Rejection Reason
                    </h4>
                    <p className="text-sm text-[#ef4444] bg-[#ef4444]/5 border border-[#ef4444]/20 p-4 rounded-lg">
                      {application.rejection_reason}
                    </p>
                  </div>
                )}
            </div>
          </ScrollArea>
        </div>

        {/* ─── Right Panel — Actions ─── */}
        <div className="w-full lg:w-[400px] shrink-0 border border-border bg-card rounded-xl flex flex-col shadow-sm">
          <div className="p-4 border-b border-border bg-accent rounded-t-xl">
            <h3 className="font-semibold text-foreground">Review Actions</h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              {/* Internal Notes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Internal Notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  disabled={isReviewed}
                  placeholder="Add internal notes about this application…"
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 disabled:opacity-60 resize-none"
                />
                {!isReviewed && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={handleSaveNotes}
                    className="bg-card border-border hover:bg-accent"
                  >
                    {isPending && (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    )}
                    Save Notes
                  </Button>
                )}
              </div>

              <Separator className="bg-border" />

              {/* Accept Form — Only for pending */}
              {application.status === "pending" && (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Project Title
                    </label>
                    <Input
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="Project title…"
                      className="bg-background border-border text-foreground h-9"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Assign Team Member
                    </label>
                    <select
                      value={assignedMemberId}
                      onChange={(e) => setAssignedMemberId(e.target.value)}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                          {m.role ? ` (${m.role})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Expected Delivery
                    </label>
                    <Input
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      className="bg-background border-border text-foreground h-9"
                    />
                  </div>

                  <Separator className="bg-border" />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium"
                      disabled={isPending}
                      onClick={handleAccept}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Accept Application
                    </Button>

                    {!showRejectForm ? (
                      <Button
                        variant="outline"
                        className="w-full border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]"
                        disabled={isPending}
                        onClick={() => setShowRejectForm(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Application
                      </Button>
                    ) : (
                      <div className="space-y-2 border border-[#ef4444]/20 rounded-lg p-3 bg-[#ef4444]/5">
                        <label className="text-xs font-semibold text-[#ef4444]">
                          Rejection Reason *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this application is being rejected…"
                          rows={3}
                          className="w-full rounded-md border border-[#ef4444]/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#ef4444]/50 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectionReason("");
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending || !rejectionReason.trim()}
                            onClick={handleReject}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                          >
                            {isPending && (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            )}
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Post-review status */}
              {application.status === "accepted" && (
                <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 p-4 rounded-lg text-center">
                  <CheckCircle2 className="h-8 w-8 text-[#22c55e] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#22c55e]">
                    Application Accepted
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Client and project have been created.
                  </p>
                </div>
              )}

              {application.status === "rejected" && (
                <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 p-4 rounded-lg text-center">
                  <XCircle className="h-8 w-8 text-[#ef4444] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#ef4444]">
                    Application Rejected
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
