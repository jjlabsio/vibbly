import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { zfd } from "zod-form-data";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const adminKey = headersList.get("x-admin-key");

    if (!adminKey || adminKey !== process.env.INTERNAL_SECRET) {
      return Response.json(
        { error: "Invalid or missing internal secret" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return Response.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json(user);
  } catch (error) {
    console.error("Failed to fetch user", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const schema = zfd.formData({
  name: zfd.text(),
  email: zfd.text(),
  image: zfd.text(),
});

export async function POST(req: Request) {
  try {
    const dataParse = schema.safeParse(await req.formData());

    if (!dataParse.success) {
      return Response.json(
        { errors: z.flattenError(dataParse.error).fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, image } = dataParse.data;

    const res = await prisma.user.create({
      data: {
        name,
        email,
        image,
        authAccounts: {
          create: {
            provider: "google",
          },
        },
      },
    });

    return Response.json(res, { status: 201 });
  } catch (error) {
    console.error("Failed to create user", error);
    return Response.json(
      { error: "Unable to create user" },
      { status: 500 }
    );
  }
}
