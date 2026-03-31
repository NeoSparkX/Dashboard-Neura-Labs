"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, ClipboardList, ExternalLink } from "lucide-react";
import { CampaignApplication, applicationColumns } from "./applications-columns";
import Link from "next/link";

type StatusTab = "all" | "pending" | "accepted" | "rejected";

interface ApplicationsDataTableProps {
  initialData: CampaignApplication[];
}

export function ApplicationsDataTable({ initialData }: ApplicationsDataTableProps) {
  const [data, setData] = useState<CampaignApplication[]>(initialData);
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Sync with initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const filteredData =
    activeTab === "all"
      ? data
      : data.filter((app) => app.status === activeTab);

  const tabs: { value: StatusTab; label: string; count: number }[] = [
    { value: "all", label: "All", count: data.length },
    { value: "pending", label: "Pending", count: data.filter((a) => a.status === "pending").length },
    { value: "accepted", label: "Accepted", count: data.filter((a) => a.status === "accepted").length },
    { value: "rejected", label: "Rejected", count: data.filter((a) => a.status === "rejected").length },
  ];

  const columnsWithActions: ColumnDef<CampaignApplication>[] = [
    ...applicationColumns,
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={`/dashboard/applications/${row.original.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6366f1] hover:text-primary hover:bg-[#6366f1]/10"
          >
            Review
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns: columnsWithActions,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Campaign Applications
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and manage Spark10 campaign applications.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-accent/50 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.value
                    ? "bg-primary/15 text-primary"
                    : "bg-accent text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 bg-card border border-border rounded-md px-3 py-2 w-full max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search applications..."
            value={
              (table.getColumn("full_name")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("full_name")?.setFilterValue(e.target.value)
            }
            className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-card border-border hover:bg-accent hover:text-foreground"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-card border-border text-foreground"
          >
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize cursor-pointer hover:bg-accent focus:bg-accent"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader className="bg-accent border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground font-medium h-10"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border hover:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithActions.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center py-10">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-foreground font-medium mb-1">
                      No applications found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "all"
                        ? "Applications submitted through the campaign will appear here."
                        : `No ${activeTab} applications.`}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} results.
        </div>
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
    </div>
  );
}
