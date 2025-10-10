import { auth } from "@/auth";
import prisma from "./prisma";

export const getKeywords = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw Error("No user.id in session");
    }

    const data = await prisma.keyword.findMany({
      where: {
        userId: session.user.id,
      },
    });

    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
