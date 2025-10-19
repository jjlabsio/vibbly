import { auth } from "@/auth";
import { CreateKeywordSchema, EditKeywordSchema } from "@/schema/keyword";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user.id;

    if (!userId) {
      return new Response("No userId in session", { status: 404 });
    }

    const data = await prisma.keyword.findMany({
      where: {
        userId,
      },
    });

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user.id;

    if (!userId) {
      return new Response("No userId in session", { status: 404 });
    }

    const body = await req.json();
    const validatedFields = CreateKeywordSchema.safeParse(body);

    if (!validatedFields.success) {
      return Response.json(
        {
          error: validatedFields.error.flatten().fieldErrors,
        },
        { status: 401 }
      );
    }

    const { text } = validatedFields.data;

    const res = await prisma.keyword.create({
      data: {
        text,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return Response.json(res);
  } catch (error) {
    console.error("POST /api/keywords error:", error);

    return Response.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = EditKeywordSchema.safeParse(body);

    if (!validatedFields.success) {
      return Response.json(
        {
          error: validatedFields.error.flatten().fieldErrors,
        },
        {
          status: 401,
        }
      );
    }

    const { text, id } = validatedFields.data;

    const res = await prisma.keyword.update({
      where: {
        id,
      },
      data: {
        text,
      },
    });

    return Response.json(res);
  } catch (error) {
    console.error("PUT /api/keywords error:", error);

    return Response.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
