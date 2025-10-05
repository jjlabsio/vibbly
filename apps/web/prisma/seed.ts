import { PrismaClient, Prisma } from "../generated/prisma";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "alice@prisma.io",
    image: "test",
  },
  {
    name: "Bob",
    email: "bob@prisma.io",
    image: "test",
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();
