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

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    openEditKeywordDialog?: (keyword: Keyword) => void;
    openDeleteKeywordDialog?: (keyword: Keyword) => void;
  }
}

function ColumnHeader({ translationKey }: { translationKey: "keyword" | "createdAt" }) {
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
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={copyToClipboard}>
          {t("copyKeyword")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>{t("editKeyword")}</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>
          {t("deleteKeyword")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Keyword>[] = [
  {
    accessorKey: "text",
    header: () => <ColumnHeader translationKey="keyword" />,
  },
  {
    accessorKey: "createdAt",
    header: () => <ColumnHeader translationKey="createdAt" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
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
