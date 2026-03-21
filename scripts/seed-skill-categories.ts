import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const skills = await prisma.skill.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  for (let i = 0; i < skills.length; i++) {
    await prisma.skillCategory.upsert({
      where: { name: skills[i].category },
      update: {},
      create: { name: skills[i].category, displayOrder: i },
    });
  }

  const cats = await prisma.skillCategory.findMany({ orderBy: { displayOrder: "asc" } });
  console.log(
    "Seeded categories:",
    cats.map((c) => `${c.name} (order: ${c.displayOrder})`)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
