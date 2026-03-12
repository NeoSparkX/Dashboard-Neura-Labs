"use client";

import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Download,
    Copy,
    ExternalLink,
    ArrowLeft,
    Mail,
    Plus,
} from "lucide-react";
import { useState } from "react";

interface InvoiceSuccessProps {
    invoiceNumber: string;
    clientName: string;
    amount: number;
    pdfUrl: string | null;
    clientEmail: string | null;
    onNewInvoice: () => void;
    onBackToList: () => void;
}

export function InvoiceSuccess({
    invoiceNumber,
    clientName,
    amount,
    pdfUrl,
    clientEmail,
    onNewInvoice,
    onBackToList,
}: InvoiceSuccessProps) {
    const [copied, setCopied] = useState(false);

    const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);

    async function handleCopyLink() {
        if (!pdfUrl) return;
        try {
            await navigator.clipboard.writeText(pdfUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = pdfUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function handleSendToClient() {
        if (!pdfUrl) return;
        const subject = encodeURIComponent(`Invoice #${invoiceNumber} from NeoSparkX`);
        const body = encodeURIComponent(
            `Hi ${clientName || "there"},\n\n` +
            `Please find your invoice #${invoiceNumber} for the amount of ${formattedAmount} ready for your review.\n\n` +
            `You can view and download the invoice using the link below:\n` +
            `${pdfUrl}\n\n` +
            `If you have any questions, feel free to reach out.\n\n` +
            `Best regards,\n` +
            `NeoSparkX Team`
        );
        const to = clientEmail ? encodeURIComponent(clientEmail) : "";
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1${to ? `&to=${to}` : ""}&su=${subject}&body=${body}`;
        window.open(gmailUrl, "_blank");
    }

    return (
        <div className="flex flex-col items-center text-center space-y-6 py-8 animate-in fade-in zoom-in duration-300">
            {/* Success icon */}
            <div className="h-16 w-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
                <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
            </div>

            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Invoice Generated Successfully
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Invoice #{invoiceNumber} for {clientName} has been created and stored in your records.
                </p>
            </div>

            {/* Invoice info card */}
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-left space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Recipient
                        </p>
                        <p className="text-sm text-foreground font-medium mt-0.5">
                            {clientName}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Amount
                        </p>
                        <p className="text-sm text-foreground font-bold mt-0.5">
                            {formattedAmount}
                        </p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium border border-[#22c55e]/20">
                        Pending
                    </span>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                {pdfUrl && (
                    <Button
                        onClick={() => window.open(pdfUrl, "_blank")}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex-1 min-w-[140px]"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                )}

                {pdfUrl && (
                    <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        className="bg-card border-border hover:bg-accent text-foreground flex-1 min-w-[140px]"
                    >
                        {copied ? (
                            <CheckCircle2 className="h-4 w-4 mr-2 text-[#22c55e]" />
                        ) : (
                            <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copied ? "Copied!" : "Copy Share Link"}
                    </Button>
                )}
            </div>

            {/* Send to Client */}
            {pdfUrl && (
                <div className="w-full max-w-md">
                    <Button
                        onClick={handleSendToClient}
                        className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white font-medium shadow-sm transition-all"
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Send to Client{clientEmail ? ` (${clientEmail})` : ""}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Opens Gmail with a pre-filled email containing the link
                    </p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-4 pt-4 border-t border-border w-full max-w-md">
                <Button
                    variant="ghost"
                    onClick={onBackToList}
                    className="text-muted-foreground hover:text-foreground flex-1"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
                </Button>
                <Button
                    variant="ghost"
                    onClick={onNewInvoice}
                    className="text-primary hover:text-[#a5b4fc] hover:bg-primary/10 flex-1"
                >
                    <Plus className="h-4 w-4 mr-2" /> Create Another
                </Button>
            </div>
        </div>
    );
}
