"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: boolean; error?: string };

const KeywordSchema = z.object({
  text: z.string().nonempty(),
  userId: z.string().nonempty(),
  createdAt: z.string(),
});

const CreateKeywordSchema = KeywordSchema.omit({
  userId: true,
  createdAt: true,
});

export async function createKeyword(
  prevResult: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user.id;

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
