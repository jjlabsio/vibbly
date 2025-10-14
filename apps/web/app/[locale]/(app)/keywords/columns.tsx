"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Keyword } from "@/generated/prisma";
import { format } from "date-fns";
import * as Icons from "@vibbly/ui/components/icons";
import { Button } from "@vibbly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vibbly/ui/components/dropdown-menu";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    openEditKeywordDialog?: (keyword: Keyword) => void;
    openDeleteKeywordDialog?: (keyword: Keyword) => void;
  }
}

export const columns: ColumnDef<Keyword>[] = [
  {
    accessorKey: "text",
    header: "keyword",
  },
  {
    accessorKey: "createdAt",
    header: "createdAt",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      const formatted = format(date, "yyyy.MM.dd HH:mm");

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const keyword = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icons.MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(keyword.text)}
            >
              Copy keyword
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                table.options.meta?.openEditKeywordDialog?.(keyword)
              }
            >
              Edit keyword
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                table.options.meta?.openDeleteKeywordDialog?.(keyword)
              }
            >
              Delete keyword
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
