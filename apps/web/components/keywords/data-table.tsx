"use client";

import { DataTablePagination } from "@/components/data-table-pagination";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@vibbly/ui/components/button";
import { Input } from "@vibbly/ui/components/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vibbly/ui/components/table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Keyword } from "@/generated/prisma";
import { CreateKeywordDialog } from "./create-dialog";
import { EditKeywordDialog } from "./edit-dialog";
import { DeleteKeywordDialog } from "./delete-dialog";
import { DeleteKeywordListDialog } from "./delete-list-dialog";
import { useQueryClient } from "@tanstack/react-query";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends Keyword, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations("Keywords.Table");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState<Keyword | null>(null);
  const [deleteListDialogOpen, setDeleteListDialogOpen] = useState(false);

  const openEditKeywordDialog = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setEditDialogOpen(true);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditingKeyword(null);
    }
  };

  const openDeleteKeywordDialog = (keyword: Keyword) => {
    setDeleteKeyword(keyword);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteKeyword(null);
    }
  };

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
    meta: {
      openEditKeywordDialog,
      openDeleteKeywordDialog,
    },
  });

  const queryClient = useQueryClient();
  const onSuccess = () => {
    table.resetRowSelection();
    queryClient.invalidateQueries({ queryKey: ["keywords"] });
  };

  return (
    <>
      <CreateKeywordDialog
        open={createDialogOpen}
        setOpen={setCreateDialogOpen}
        onSuccess={onSuccess}
      />
      <EditKeywordDialog
        key={editingKeyword?.id}
        open={editDialogOpen}
        setOpen={handleEditDialogOpenChange}
        keyword={editingKeyword}
        onSuccess={onSuccess}
      />
      <DeleteKeywordDialog
        key={deleteKeyword?.id}
        open={deleteDialogOpen}
        setOpen={handleDeleteDialogOpenChange}
        keyword={deleteKeyword}
        onSuccess={onSuccess}
      />
      <DeleteKeywordListDialog
        key={Object.keys(rowSelection).join()}
        open={deleteListDialogOpen}
        setOpen={setDeleteListDialogOpen}
        keywordIds={Object.keys(rowSelection)}
        onSuccess={onSuccess}
      />
      <div>
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder={t("filterPlaceholder")}
            value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("text")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={Object.keys(rowSelection).length === 0}
              onClick={() => setDeleteListDialogOpen(true)}
            >
              {t("deleteSelected")}
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              {t("addKeyword")}
            </Button>
          </div>
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
                              header.column.columnDef.header,
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
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
    </>
  );
}
