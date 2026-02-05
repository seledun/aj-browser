import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// Prevent multiple clients in dev (Next.js hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaBetterSqlite3({
  url: "file: ./prisma/store.db",
})

export const prisma = new PrismaClient({ adapter, log: ["query", "info", "warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
