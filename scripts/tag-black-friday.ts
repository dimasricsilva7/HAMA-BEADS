import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const rows = await db.product.findMany({
    where: { sourceCollectionId: { in: ["596", "597", "469"] }, active: true },
    select: { id: true, priceCents: true, compareAtPriceCents: true },
  });
  const discounted = rows.filter((product) => (product.compareAtPriceCents ?? 0) > product.priceCents);
  for (let index = 0; index < discounted.length; index += 50) {
    const chunk = discounted.slice(index, index + 50);
    await db.$transaction(chunk.map((product) => db.product.update({
      where: { id: product.id },
      data: { badge: "BLACK FRIDAY" },
    })));
  }
  console.info("FOOTWEAR_BLACK_FRIDAY_TAGS " + JSON.stringify({ catalogProducts: rows.length, discountedTagged: discounted.length }));
}
main().catch((error) => {
  console.error("FOOTWEAR_BLACK_FRIDAY_TAGS_FAILED", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
