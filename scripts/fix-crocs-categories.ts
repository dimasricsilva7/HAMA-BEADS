import { PrismaClient, type ProductCategory } from "@prisma/client";

const db = new PrismaClient();

function classify(name: string, current: ProductCategory): ProductCategory {
  const value = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/jibbitz|charm|\bpin\b|enfeite/.test(value)) return "JIBBITZ";
  if (/\bclog\b/.test(value)) return "CLOGS";
  if (/\bslide\b/.test(value)) return "SLIDES";
  if (/sandal|\bflip\b|chinelo/.test(value)) return "SANDALS";
  if (/tennis|\btenis\b|sneaker|pacer|runner/.test(value)) return "FOOTWEAR";
  return current;
}

async function main() {
  let changed = 0;
  const rows = await db.product.findMany({
    where: { sourceCollectionId: "596" },
    select: { id: true, name: true, category: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const next = classify(row.name, row.category);
    counts[next] = (counts[next] ?? 0) + 1;
    if (next !== row.category) {
      await db.product.update({ where: { id: row.id }, data: { category: next } });
      changed++;
    }
  }
  console.info("CROCS_CATEGORY_FIX " + JSON.stringify({ scanned: rows.length, changed, distribution: counts }));
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error("CROCS_CATEGORY_FIX_FAILED", error instanceof Error ? error.message : String(error));
  await db.$disconnect().catch(() => {});
  process.exitCode = 1;
});
