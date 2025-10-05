import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { zfd } from "zod-form-data";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const headersList = await headers();
  const adminKey = headersList.get("x-admin-key");
  if (adminKey !== process.env.INTERNAL_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return new Response("No email", {
      status: 203,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  return Response.json(user);
}

const schema = zfd.formData({
  name: zfd.text(),
  email: zfd.text(),
  image: zfd.text(),
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const dataParse = schema.safeParse(formData);

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

  return Response.json(res);
}
