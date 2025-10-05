import path from "node:path";
import { config } from "dotenv";
import type { PrismaConfig } from "prisma";

const envFile =
  process.env.NODE_ENV === "development" ? ".env.local" : ".env.production";
config({ path: envFile });

export default {
  schema: path.join("prisma"),
} satisfies PrismaConfig;
