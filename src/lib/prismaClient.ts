import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import { PrismaClient, Prisma, ProjectStatus } from "../../generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

export { Prisma, ProjectStatus };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
