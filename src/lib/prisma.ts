import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPkg from "@prisma/client";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

const { PrismaClient } = prismaClientPkg;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function createPrismaClient() {
  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL is required before using the database");
  }

  return new PrismaClient({ adapter: new PrismaPg(connectionString) });
}

export function getDb() {
  const db = globalForPrisma.prisma ?? createPrismaClient();

  if (process.env["NODE_ENV"] !== "production") {
    globalForPrisma.prisma = db;
  }

  return db;
}
