import { PrismaClient, Prisma } from "../../generated/prisma";

const prisma = new PrismaClient();
const userId = "cmgc00t150000wfm4wnjl8d3a";

const keywordData: Prisma.KeywordCreateInput[] = Array.from(
  { length: 10 },
  (_, i) => ({
    text: `keyword ${i}`,
    user: {
      connect: {
        id: userId,
      },
    },
  })
);

export async function main() {
  for (const k of keywordData) {
    await prisma.keyword.create({
      data: k,
    });
  }
}

main();
