"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Loader2, FileText, MoreHorizontal } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Invoice } from "./invoices-columns";
import { getEffectiveInvoiceStatus, type InvoiceSnapshot } from "@/lib/invoices/metrics";
import { InvoiceDocument } from "./invoice-pdf";
import { InvoiceSuccess } from "./invoice-success";

interface GeneratedInvoice {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  pdfUrl: string | null;
  clientEmail: string | null;
}

/* ─── helpers ─── */
type Client = { id: string; company_name: string; email?: string; phone?: string; country?: string };
type ProjectOption = { id: string; project_name: string };

const today = () => new Date().toISOString().split("T")[0];
const in30 = () => new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0];

const EMPTY_INV = {
  client_id: "", project_id: "", invoice_number: "", amount: "",
  currency: "USD", issue_date: today(), due_date: in30(),
  status: "Draft" as Invoice["status"], notes: "", tax_percent: "",
};

const EMPTY_PAY = {
  amount: "", payment_date: today(), payment_method: "", notes: "",
};

/* ─── standalone form components (outside to avoid remount) ─── */
function InvoiceForm({
  form, onChange, error, saving, isGeneratingPdf, clients, projects, onSave, onCancel,
}: {
  form: typeof EMPTY_INV;
  onChange: (k: keyof typeof EMPTY_INV, v: string) => void;
  error: string | null; saving: boolean; isGeneratingPdf: boolean;
  clients: Client[]; projects: ProjectOption[];
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Client *</label>
          <select value={form.client_id} onChange={(e) => onChange("client_id", e.target.value)} className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none">
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Project (optional)</label>
          <select value={form.project_id} onChange={(e) => onChange("project_id", e.target.value)} className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none">
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Invoice # (auto if blank)</label>
          <Input value={form.invoice_number} onChange={(e) => onChange("invoice_number", e.target.value)} placeholder="INV-2025-0001" className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amount (USD) *</label>
          <Input type="number" value={form.amount} onChange={(e) => onChange("amount", e.target.value)} placeholder="0.00" className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Issue Date *</label>
          <Input type="date" value={form.issue_date} onChange={(e) => onChange("issue_date", e.target.value)} className="bg-background border-border text-foreground h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Due Date *</label>
          <Input type="date" value={form.due_date} onChange={(e) => onChange("due_date", e.target.value)} className="bg-background border-border text-foreground h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tax %</label>
          <Input type="number" value={form.tax_percent} onChange={(e) => onChange("tax_percent", e.target.value)} placeholder="0" className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select value={form.status} onChange={(e) => onChange("status", e.target.value as Invoice["status"])} className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none">
            {["Draft", "Pending", "Paid", "Overdue", "Partial"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <Input value={form.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="Optional notes" className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" disabled={saving} onClick={onCancel} className="text-muted-foreground">Cancel</Button>
        <Button size="sm" disabled={saving || isGeneratingPdf} onClick={onSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {(saving || isGeneratingPdf) && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} {isGeneratingPdf ? "Generating PDF..." : "Create Invoice"}
        </Button>
      </div>
    </div>
  );
}

function PaymentForm({
  form, onChange, error, saving, onSave, onCancel,
}: {
  form: typeof EMPTY_PAY;
  onChange: (k: keyof typeof EMPTY_PAY, v: string) => void;
  error: string | null; saving: boolean; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amount *</label>
          <Input type="number" value={form.amount} onChange={(e) => onChange("amount", e.target.value)} placeholder="0.00" className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Payment Date</label>
          <Input type="date" value={form.payment_date} onChange={(e) => onChange("payment_date", e.target.value)} className="bg-background border-border text-foreground h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Method</label>
          <select value={form.payment_method} onChange={(e) => onChange("payment_method", e.target.value)} className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none">
            <option value="">Select…</option>
            {["Bank Transfer", "Stripe / Credit Card", "PayPal", "Wire Transfer", "ACH Transfer", "Cash", "Check"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <Input value={form.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="Optional" className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" disabled={saving} onClick={onCancel} className="text-muted-foreground">Cancel</Button>
        <Button size="sm" disabled={saving} onClick={onSave} className="bg-[#22c55e] hover:bg-[#16a34a] text-white">
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Record Payment
        </Button>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
interface InvoicesDataTableProps {
  columns: ColumnDef<Invoice, unknown>[];
  data: Invoice[];
}

export function InvoicesDataTable({ columns, data: initialData }: InvoicesDataTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [invForm, setInvForm] = useState(EMPTY_INV);
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [invError, setInvError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoice | null>(null);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((p) => setClients(p?.clients ?? [])).catch(() => { });
    fetch("/api/projects").then((r) => r.json()).then((p) => setProjects(p?.projects ?? [])).catch(() => { });
  }, []);

  function setInvField(k: keyof typeof EMPTY_INV, v: string) { setInvForm((p) => ({ ...p, [k]: v })); }
  function setPayField(k: keyof typeof EMPTY_PAY, v: string) { setPayForm((p) => ({ ...p, [k]: v })); }

  async function handleCreate() {
    setInvError(null);
    startTransition(async () => {
      const body: Record<string, unknown> = { ...invForm };
      if (!invForm.project_id) delete body.project_id;
      if (!invForm.invoice_number) delete body.invoice_number;
      if (!invForm.tax_percent) delete body.tax_percent;
      if (!invForm.notes) delete body.notes;
      if (invForm.amount) body.amount = Number(invForm.amount);
      if (invForm.tax_percent) body.tax_percent = Number(invForm.tax_percent);

      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await res.json().catch(() => null);
      if (!res.ok) { setInvError(payload?.error ?? "Failed to create invoice"); return; }
      const inv = payload.invoice;
      const clientName = clients.find((c) => c.id === inv.client_id)?.company_name ?? "Unknown";

      setIsGeneratingPdf(true);
      try {
        const client = clients.find((c) => c.id === inv.client_id);
        const invWithInfo = {
          ...inv,
          client_name: clientName,
          client_email: client?.email,
          client_phone: client?.phone,
          client_address: client?.country
        };
        const blob = await pdf(<InvoiceDocument invoice={invWithInfo} />).toBlob();
        const fd = new FormData();
        fd.append("file", new File([blob], `invoice-${inv.invoice_number}.pdf`, { type: "application/pdf" }));
        fd.append("bucket", "invoices");
        fd.append("path", `invoice-${inv.invoice_number}.pdf`);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const { url: pdfUrl } = await uploadRes.json();
          await fetch("/api/invoices", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: inv.id, pdf_url: pdfUrl }),
          });
          await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: `invoice-${inv.invoice_number}.pdf`,
              file_url: pdfUrl,
              file_type: "application/pdf",
              file_size: blob.size,
              client_name: clientName,
              description: `Generated Invoice #${inv.invoice_number}`,
            }),
          });
          inv.pdf_url = pdfUrl;
        }

        setGeneratedInvoice({
          invoiceNumber: inv.invoice_number,
          clientName: clientName,
          amount: inv.amount,
          pdfUrl: inv.pdf_url,
          clientEmail: client?.email ?? null,
        });
        setShowCreateForm(false);
        setInvForm(EMPTY_INV);
      } catch (err) {
        console.error("PDF automation error:", err);
      } finally {
        setIsGeneratingPdf(false);
      }

      setInvoices((prev) => [{ ...inv, client_name: clientName }, ...prev]);
      setInvForm(EMPTY_INV);
      setShowCreateForm(false);
    });
  }

  async function handleRecordPayment() {
    if (!payingInvoice) return;
    setPayError(null);
    startTransition(async () => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payForm, invoice_id: payingInvoice.id, amount: Number(payForm.amount) }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) { setPayError(payload?.error ?? "Failed to record payment"); return; }
      // Refresh invoice status optimistically
      const paidAmt = Number(payForm.amount);
      const nextStoredStatus: Invoice["status"] = paidAmt >= payingInvoice.amount ? "Paid" : "Partial";
      const nextEffectiveStatus = getEffectiveInvoiceStatus(
        {
          id: payingInvoice.id,
          amount: payingInvoice.amount,
          status: nextStoredStatus,
          due_date: payingInvoice.due_date,
          issue_date: payingInvoice.issue_date,
        } satisfies InvoiceSnapshot,
        new Date()
      );
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === payingInvoice.id ? { ...inv, status: nextEffectiveStatus } : inv
        )
      );
      setPayForm(EMPTY_PAY);
      setPayingInvoice(null);
    });
  }

  async function handleStatusChange(id: string, status: Invoice["status"]) {
    startTransition(async () => {
      const res = await fetch("/api/invoices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const payload = await res.json().catch(() => null);
      if (res.ok && payload?.invoice) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === id
              ? {
                ...inv,
                status: getEffectiveInvoiceStatus(
                  {
                    id: inv.id,
                    amount: inv.amount,
                    status,
                    due_date: inv.due_date,
                    issue_date: inv.issue_date,
                  } satisfies InvoiceSnapshot,
                  new Date()
                ),
              }
              : inv
          )
        );
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await fetch("/api/invoices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    });
  }

  const actionColumn: ColumnDef<Invoice, unknown> = {
    id: "actions",
    cell: ({ row }) => {
      const inv = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
            <DropdownMenuLabel className="text-muted-foreground">Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { setPayingInvoice(inv); setPayForm(EMPTY_PAY); setPayError(null); }} className="cursor-pointer hover:bg-accent focus:bg-accent">
              Record Payment
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-accent" />
            {inv.status !== "Paid" && (
              <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "Paid")} className="cursor-pointer hover:bg-accent focus:bg-accent">
                Mark as Paid
              </DropdownMenuItem>
            )}
            {inv.status === "Draft" && (
              <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "Pending")} className="cursor-pointer hover:bg-accent focus:bg-accent">
                Send (Mark Pending)
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-accent" />
            <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="cursor-pointer text-[#ef4444] focus:text-[#ef4444] hover:bg-[#ef4444]/10 focus:bg-[#ef4444]/10">
              Delete Invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };

  const allColumns = [...columns.filter((c) => c.id !== "actions"), actionColumn];

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setInvError(null);
    setInvForm(EMPTY_INV);
  };

  const table = useReactTable({
    data: invoices,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });

  return (
    <div className="space-y-6">
      {generatedInvoice ? (
        <InvoiceSuccess
          invoiceNumber={generatedInvoice.invoiceNumber}
          clientName={generatedInvoice.clientName}
          amount={generatedInvoice.amount}
          pdfUrl={generatedInvoice.pdfUrl}
          clientEmail={generatedInvoice.clientEmail}
          onNewInvoice={() => {
            setGeneratedInvoice(null);
            setShowCreateForm(true);
          }}
          onBackToList={() => setGeneratedInvoice(null)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-2 bg-card border border-border rounded-md px-3 py-2 w-full max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search by invoice or client..."
                value={(table.getColumn("client_name")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("client_name")?.setFilterValue(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground text-foreground"
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowCreateForm((prev) => !prev);
                setInvError(null);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-1" />
              {showCreateForm ? "Close Form" : "Create Invoice"}
            </Button>
          </div>

          {showCreateForm && (
            <div className="rounded-xl border border-border bg-card p-4">
              <InvoiceForm
                form={invForm}
                onChange={setInvField}
                error={invError}
                saving={isPending}
                isGeneratingPdf={isGeneratingPdf}
                clients={clients}
                projects={projects}
                onSave={handleCreate}
                onCancel={handleCancelCreate}
              />
            </div>
          )}

          {payingInvoice && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Record Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    {payingInvoice.invoice_number} for {payingInvoice.client_name}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPayingInvoice(null);
                    setPayError(null);
                    setPayForm(EMPTY_PAY);
                  }}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
              <PaymentForm
                form={payForm}
                onChange={setPayField}
                error={payError}
                saving={isPending}
                onSave={handleRecordPayment}
                onCancel={() => {
                  setPayingInvoice(null);
                  setPayError(null);
                  setPayForm(EMPTY_PAY);
                }}
              />
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-accent border-b border-border">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-b border-border hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="text-muted-foreground font-medium h-10">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-b border-border hover:bg-accent/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={allColumns.length} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">No invoices yet.</p>
                        <Button
                          size="sm"
                          onClick={() => setShowCreateForm(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Create Invoice
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} invoice{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-card border-border hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-card border-border hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
