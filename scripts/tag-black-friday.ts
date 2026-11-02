import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BLACK_FRIDAY_IDS = new Set(["595", "596", "599"]);

async function main() {
  const rows = await db.product.findMany({
    where: { active: true },
    select: {
      id: true,
      priceCents: true,
      compareAtPriceCents: true,
      individualDiscountPercent: true,
      sourceCollectionIds: true,
      homeBlackFriday: true,
    },
  });

  const campaignRows = rows.filter((product) => {
    const memberships = Array.isArray(product.sourceCollectionIds)
      ? product.sourceCollectionIds.filter((value): value is string => typeof value === "string")
      : [];
    return product.homeBlackFriday || memberships.some((id) => BLACK_FRIDAY_IDS.has(id));
  });
  const discounted = campaignRows.filter((product) =>
    (product.compareAtPriceCents ?? 0) > product.priceCents || (product.individualDiscountPercent ?? 0) > 0
  );

  for (let index = 0; index < campaignRows.length; index += 50) {
    const chunk = campaignRows.slice(index, index + 50);
    await db.$transaction(chunk.map((product) => db.product.update({
      where: { id: product.id },
      data: { badge: "BLACK FRIDAY" },
    })));
  }

  console.info("FOOTWEAR_BLACK_FRIDAY_TAGS " + JSON.stringify({
    activeProducts: rows.length,
    campaignProducts: campaignRows.length,
    discountedProducts: discounted.length,
  }));
}

main().catch((error) => {
  console.error("FOOTWEAR_BLACK_FRIDAY_TAGS_FAILED", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
