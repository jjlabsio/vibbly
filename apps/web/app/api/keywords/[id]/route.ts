import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await prisma.keyword.findUnique({
      where: {
        id,
      },
    });

    if (!data) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch keyword", error);
    return NextResponse.json(
      {
        error: "Failed to fetch keyword",
      },
      { status: 500 }
    );
  }
}
