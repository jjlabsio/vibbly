"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Input } from "@vibbly/ui/components/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vibbly/ui/components/table";
import React, { useMemo } from "react";
import { DataTablePagination } from "./data-table-pagination";
import { useTranslations } from "next-intl";
import { DialogButton } from "./dialog-button";
import { Content } from "@/lib/youtube/me";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
}

export interface Channels {
  id: string;
  videos: string[];
}

export function DataTable({ columns, data }: DataTableProps<Content>) {
  const t = useTranslations("VideoTable");

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [open, setOpen] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    state: {
      columnFilters,
      rowSelection,
    },
  });

  const selectedVideos = useMemo(() => {
    const grouped = new Map<string, string[]>();

    Object.entries(rowSelection).forEach(([rowId, isSelected]) => {
      if (!isSelected) return;

      const video = data.find((item) => item.id === rowId);
      if (!video) return;

      const videos = grouped.get(video.accountId) ?? [];
      videos.push(video.id);
      grouped.set(video.accountId, videos);
    });

    return Array.from(grouped.entries()).map(([id, videos]) => ({
      id,
      videos,
    }));
  }, [data, rowSelection]);

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DialogButton
          open={open}
          onOpenChange={setOpen}
          videos={selectedVideos}
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            typeof header.column.columnDef.header === "string"
                              ? t(header.column.columnDef.header)
                              : header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
