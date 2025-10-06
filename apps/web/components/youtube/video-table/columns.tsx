"use client";

import { Content } from "@/lib/youtube/me";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@vibbly/ui/components/checkbox";
import { format } from "date-fns";

export const columns: ColumnDef<Content>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Columns.title",
  },
  {
    accessorKey: "accountName",
    header: "Columns.account",
  },
  {
    accessorKey: "publishedAt",
    header: "Columns.publishedAt",
    cell: ({ row }) => {
      const date = new Date(row.getValue("publishedAt"));
      const formatted = format(date, "yyyy.MM.dd HH:mm");

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
];
