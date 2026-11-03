import { Prisma, PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const FOOTWEAR_CATEGORIES = ["CLOGS", "SANDALS", "SLIDES", "KIDS", "FOOTWEAR"] as const;

type Variant = {
  id?: string;
  sku?: string;
  label?: string;
  options?: { name?: string; value?: string }[];
  priceCents?: number;
  stockQuantity?: number;
  available?: boolean;
  [key: string]: unknown;
};

function isSizeDimension(name: string) {
  const value = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return value.includes("size") || value.includes("tamanho") || value.includes("numera") || value === "eu";
}

/**
 * O estoque físico da operação é independente do estoque do catálogo externo.
 * O responsável pela loja confirmou que mantém estoque próprio em todas as
 * numerações. Para variantes de tamanho com preço válido, mantém a opção
 * comprável, preservando quantidades existentes e garantindo pelo menos 1.
 */
async function main() {
  const products = await db.product.findMany({
    where: {
      active: true,
      fulfillment: "PHYSICAL",
      category: { in: [...FOOTWEAR_CATEGORIES] },
      priceCents: { gt: 0 },
    },
    select: { id: true, name: true, variants: true, stockStatus: true, stockQuantity: true },
  });

  let productsUpdated = 0;
  let sizesEnabled = 0;

  for (const product of products) {
    const variants = Array.isArray(product.variants) ? product.variants as unknown as Variant[] : [];
    if (!variants.length) continue;

    let changed = false;
    let localQuantity = 0;
    const next = variants.map((variant) => {
      const hasSize = (variant.options ?? []).some((option) => isSizeDimension(option.name ?? ""));
      if (!hasSize || !Number.isInteger(variant.priceCents) || Number(variant.priceCents) <= 0) return variant;

      const nextQuantity = Math.max(1, Math.floor(Number(variant.stockQuantity) || 0));
      if (variant.available !== true || Number(variant.stockQuantity) !== nextQuantity) changed = true;
      sizesEnabled++;
      localQuantity += nextQuantity;
      return { ...variant, available: true, stockQuantity: nextQuantity };
    });

    if (!localQuantity) continue;
    if (changed || product.stockStatus !== "IN_STOCK" || Number(product.stockQuantity ?? 0) < localQuantity) {
      await db.product.update({
        where: { id: product.id },
        data: {
          variants: next as unknown as Prisma.InputJsonValue,
          stockStatus: "IN_STOCK",
          stockQuantity: Math.max(localQuantity, Number(product.stockQuantity ?? 0)),
        },
      });
      productsUpdated++;
    }
  }

  console.info("FOOTWEAR_SIZE_AVAILABILITY " + JSON.stringify({
    productsScanned: products.length,
    productsUpdated,
    sizeVariantsEnabled: sizesEnabled,
  }));
}

main()
  .catch((error) => {
    console.error("FOOTWEAR_SIZE_AVAILABILITY_FAILED", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
