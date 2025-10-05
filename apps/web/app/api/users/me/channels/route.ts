import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  console.log("session :>> ", session);

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  console.log("token :>> ", token);

  return NextResponse.json({ message: "test" });
}
