import { PrismaClient } from "@prisma/client";

// Reused across hot reloads from `node --watch` so we don't exhaust connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__aceoutPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

globalForPrisma.__aceoutPrisma = prisma;
