"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Content = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
};

export const columns: ColumnDef<Content>[] = [
  {
    accessorKey: "title",
    header: "title",
  },
  {
    accessorKey: "description",
    header: "description",
  },
  {
    accessorKey: "publishedAt",
    header: "publishedAt",
  },
];
