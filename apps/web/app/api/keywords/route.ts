import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

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
