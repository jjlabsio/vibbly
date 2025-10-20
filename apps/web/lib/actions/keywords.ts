"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const KeywordSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, { error: "textError" }),
  userId: z.string().min(1),
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

export type ActionState = {
  success: boolean;
  errors?: {
    text?: string[];
  };
  message?: string | null;
};

export async function createKeyword(
  prevResult: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    return { success: false, message: "No userId in session" };
  }

  const validatedFields = CreateKeywordSchema.safeParse({
    text: formData.get("keyword"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to create keyword",
    };
  }

  const { text } = validatedFields.data;

  try {
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
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Database Error: Failed to create keyword.",
    };
  }

  revalidatePath("/keywords");

  return {
    success: true,
  };
}

export async function editKeyword(
  id: string,
  prevResult: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!id) {
    return { success: false, message: "Invalid keyword." };
  }

  const validatedFields = EditKeywordSchema.safeParse({
    text: formData.get("keyword"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to edit keyword",
    };
  }

  const { text } = validatedFields.data;

  try {
    await prisma.keyword.update({
      data: {
        text,
      },
      where: {
        id,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Database Error: Failed to update keyword.",
    };
  }

  revalidatePath("/keywords");

  return { success: true };
}

export async function deleteKeyword(id: string) {
  await prisma.keyword.delete({
    where: {
      id,
    },
  });

  revalidatePath("/keywords");
}

export async function deleteKeywordList(ids: string[]) {
  await prisma.keyword.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}
