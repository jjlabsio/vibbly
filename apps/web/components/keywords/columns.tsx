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
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Checkbox } from "@vibbly/ui/components/checkbox";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    openEditKeywordDialog?: (keyword: Keyword) => void;
    openDeleteKeywordDialog?: (keyword: Keyword) => void;
  }
}

function ColumnHeader({
  translationKey,
}: {
  translationKey: "keyword" | "updatedAt";
}) {
  const t = useTranslations("Keywords.Table.Columns");

  return <>{t(translationKey)}</>;
}

type ActionsCellProps = {
  keyword: Keyword;
  onEdit: () => void;
  onDelete: () => void;
};

function ActionsCell({ keyword, onEdit, onDelete }: ActionsCellProps) {
  const t = useTranslations("Keywords.Table.Actions");
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(keyword.text);
  }, [keyword.text]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t("openMenu")}</span>
          <Icons.MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard}>
          <Icons.Copy />
          {t("copyKeyword")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Icons.SquarePen />
          {t("editKeyword")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Icons.Trash2 />
          {t("deleteKeyword")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Keyword>[] = [
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
    accessorKey: "text",
    header: () => <ColumnHeader translationKey="keyword" />,
  },
  {
    accessorKey: "updatedAt",
    header: () => <ColumnHeader translationKey="updatedAt" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      const formatted = format(date, "yyyy.MM.dd HH:mm");

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <ActionsCell
        keyword={row.original}
        onEdit={() => table.options.meta?.openEditKeywordDialog?.(row.original)}
        onDelete={() =>
          table.options.meta?.openDeleteKeywordDialog?.(row.original)
        }
      />
    ),
  },
];
