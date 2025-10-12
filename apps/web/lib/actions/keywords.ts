"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: boolean; error?: string };

const KeywordSchema = z.object({
  id: z.string().nonempty(),
  text: z.string().nonempty(),
  userId: z.string().nonempty(),
  createdAt: z.string(),
});

const CreateKeywordSchema = KeywordSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});
const EditKeywordSchema = KeywordSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});

export async function createKeyword(
  prevResult: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user.id;

  console.log("userId :>> ", userId);

  if (!userId) {
    return { success: false, error: "No userId" };
  }

  const { text } = CreateKeywordSchema.parse({
    text: formData.get("keyword"),
  });

  await prisma.keyword.create({
    data: {
      text,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });

  revalidatePath("/keywords");

  return { success: true };
}

export async function editKeyword(
  id: string,
  prevResult: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "Invalid keyword." };
  }

  const { text } = EditKeywordSchema.parse({
    text: formData.get("keyword"),
  });

  await prisma.keyword.update({
    data: {
      text,
    },
    where: {
      id,
    },
  });

  revalidatePath("/keywords");

  return { success: true };
}
