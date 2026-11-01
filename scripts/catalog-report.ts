import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  try {
    const [total, active, priced, inStock, adult, kids, jibbitz, withImage, samples] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { active: true } }),
      db.product.count({ where: { active: true, priceCents: { gt: 0 } } }),
      db.product.count({ where: { active: true, priceCents: { gt: 0 }, stockStatus: { not: "OUT_OF_STOCK" } } }),
      db.product.count({ where: { sourceCollectionId: "596", active: true } }),
      db.product.count({ where: { sourceCollectionId: "597", active: true } }),
      db.product.count({ where: { sourceCollectionId: "469", active: true } }),
      db.product.count({ where: { active: true, imageUrl: { not: null } } }),
      db.product.findMany({
        where: { active: true, priceCents: { gt: 0 } },
        orderBy: { sortOrder: "asc" },
        take: 5,
        select: { name: true, sourceCollectionId: true, category: true, priceCents: true, imageUrl: true, stockStatus: true },
      }),
    ]);
    console.info("FOOTWEAR_CATALOG_DATABASE_REPORT " + JSON.stringify({
      total, active, priced, inStock, adult, kids, jibbitz, withImage,
      samples: samples.map((p) => ({
        name: p.name, collection: p.sourceCollectionId, category: p.category,
        priceCents: p.priceCents, hasImage: Boolean(p.imageUrl), stockStatus: p.stockStatus,
      })),
    }));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("FOOTWEAR_CATALOG_DATABASE_REPORT_FAILED", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
