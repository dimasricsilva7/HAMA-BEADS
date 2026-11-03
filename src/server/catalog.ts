import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import type { Product } from "@prisma/client";
import { db } from "@/lib/db";
import { assignAll, priceOverrides, type Assignment, type ExperimentDef, type ExperimentVariant } from "@/lib/experiments";
import { effectivePrice } from "@/lib/pricing";
import type { GalleryImage, ProductComponent, ProductSpec } from "@/lib/domain";
import type { ProductVariant, PublicProduct, ProductColorFamilyItem } from "@/types/catalog";
import { productColorOptions } from "@/lib/crocs-colors";

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Produtos ativos (cache invalidado pela tag "catalog" em qualquer edição no admin). */
export const getActiveProducts = unstable_cache(
  async () => db.product.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ["active-products-v4-crocs-full-catalog-20261102"],
  { tags: ["catalog"], revalidate: 300 }
);

/** Descontos de seção: cacheados separadamente para evitar uma ida ao banco em cada página. */
const getActiveSectionDiscounts = unstable_cache(
  async () => db.sectionDiscount.findMany({ where: { active: true } }).catch(() => []),
  ["active-section-discounts-v1"],
  { tags: ["catalog"], revalidate: 300 }
);

export const getActiveExperiments = unstable_cache(
  async (): Promise<ExperimentDef[]> => {
    const rows = await db.experiment.findMany({ where: { active: true } }); // erro não vai para o cache
    return rows.map((r) => ({ key: r.key, target: r.target, variants: asArray<ExperimentVariant>(r.variants) }));
  },
  ["active-experiments-v2"],
  { tags: ["experiments"], revalidate: 300 }
);

export async function assignmentsFor(visitorId: string | null | undefined): Promise<Assignment[]> {
  return assignAll(visitorId, await getActiveExperiments().catch(() => []));
}

/** Variantes A/B do visitante atual (cookie hb_vid, definido pelo middleware). */
export async function currentAssignments(): Promise<Assignment[]> {
  const vid = (await cookies()).get("hb_vid")?.value;
  return assignmentsFor(vid);
}

export function toPublicProduct(
  p: Product,
  overrides: Record<string, number> = {},
  sectionDiscountPercent: number | null = null,
  now = new Date()
): PublicProduct {
  const price = effectivePrice(p, overrides, now, sectionDiscountPercent);
  const variants = asArray<ProductVariant>(p.variants)
    .filter((v) => v?.id && v?.sku && Number.isInteger(v?.priceCents))
    .map((v) => {
      const variantPrice = effectivePrice({
        ...p,
        priceCents: v.priceCents,
        compareAtPriceCents: v.listPriceCents,
        promoPriceCents: null,
        promoStartsAt: null,
        promoEndsAt: null,
        promoLabel: null,
      }, overrides, now, sectionDiscountPercent);
      return { ...v, priceCents: variantPrice.priceCents, listPriceCents: variantPrice.listPriceCents };
    });
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brandName: p.sourceProductId ? "Crocs" : null,
    sourceCollectionId: p.sourceCollectionId,
    sourceCollectionIds: [...new Set([...asArray<string>(p.sourceCollectionIds), ...(p.sourceCollectionId ? [p.sourceCollectionId] : [])])],
    category: p.category,
    fulfillment: p.fulfillment,
    shortDescription: p.shortDescription,
    description: p.description,
    priceCents: price.priceCents,
    listPriceCents: price.listPriceCents,
    individualDiscountPercent: p.individualDiscountPercent,
    promoLabel: price.promoLabel,
    promoEndsAt: price.promoEndsAt,
    beadCount: p.beadCount,
    colorCount: p.colorCount,
    pegboardCount: p.pegboardCount,
    modelCount: p.modelCount,
    components: asArray<ProductComponent>(p.components),
    specs: asArray<ProductSpec>(p.specs).filter((s) => s?.label && s?.value),
    imageUrl: p.imageUrl,
    variants,
    gallery: asArray<GalleryImage>(p.gallery).filter((g) => g?.url),
    videoUrl: p.videoUrl,
    badge: p.badge,
    featured: p.featured,
    homeBlackFriday: p.homeBlackFriday,
    homeFeaturedOffer: p.homeFeaturedOffer,
    colorFamily: [],
    stockStatus: p.stockStatus,
    crossSellIds: asArray<string>(p.crossSellIds),
    includedProductIds: asArray<string>(p.includedProductIds),
    digitalDeliveryNote: p.digitalDeliveryNote,
    sortOrder: p.sortOrder,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

/** Produto vendável: ativo e com preço válido (produtos sem preço definido nunca aparecem). */
export const isSellable = (p: Pick<Product, "active" | "priceCents" | "stockStatus">) => p.active && p.priceCents > 0 && p.stockStatus !== "OUT_OF_STOCK";

const buildPublicCatalog = unstable_cache(
  async (list: Assignment[]) => {
  const [products, rules] = await Promise.all([
    getActiveProducts().catch(() => []),
    getActiveSectionDiscounts(),
  ]);
  const overrides = priceOverrides(list);
  const now = new Date();
  const discountByCategory = new Map(
    rules
      .filter((r) => (!r.startsAt || r.startsAt <= now) && (!r.endsAt || r.endsAt > now))
      .map((r) => [r.category, r.percent])
  );
  // Hide the previous bead-craft catalog from the public footwear storefront.
  // Records remain available in Admin; no old Hama Beads products leak into the Crocs catalog.
  const legacyCraftCategories = new Set(["BEADS", "PEGBOARD", "TWEEZERS", "DIGITAL_MODELS", "KIT"]);
  const publicProducts = products
    .filter((p) => p.priceCents > 0 && !legacyCraftCategories.has(p.category))
    .map((p) => toPublicProduct(p, overrides, discountByCategory.get(p.category) ?? null, now));

  // A VTEX style can have separate master products for each color. Group them
  // by normalized model name so cards and the PDP can expose the complete color family.
  const familyMap = new Map<string, ProductColorFamilyItem[]>();
  for (const product of publicProducts) {
    if (product.category === "JIBBITZ") continue;
    const familyKey = `${product.category}:${product.name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/\\s+/g, " ").trim()}`;
    const family = familyMap.get(familyKey) ?? [];
    const colors = productColorOptions(product.variants);
    for (const value of colors) {
      const key = value.toLocaleLowerCase("pt-BR");
      if (family.some((item) => item.value.toLocaleLowerCase("pt-BR") === key)) continue;
      family.push({
        id: product.id,
        slug: product.slug,
        value: value || "Ver cor",
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        listPriceCents: product.listPriceCents,
        available: product.stockStatus !== "OUT_OF_STOCK",
      });
    }
    familyMap.set(familyKey, family);
  }

  return publicProducts.map((product) => {
    if (product.category === "JIBBITZ") return product;
    const familyKey = `${product.category}:${product.name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/\\s+/g, " ").trim()}`;
    const colors = familyMap.get(familyKey) ?? [];
    return { ...product, colorFamily: colors };
  });
  },
  ["public-catalog-by-assignment-v1"],
  { tags: ["catalog", "experiments"], revalidate: 300 }
);

type HomeCatalogProduct = Pick<PublicProduct,
  | "id" | "slug" | "sku" | "name" | "brandName" | "sourceCollectionId" | "sourceCollectionIds"
  | "category" | "priceCents" | "listPriceCents" | "individualDiscountPercent" | "imageUrl"
  | "badge" | "stockStatus" | "homeBlackFriday" | "colorFamily" | "variants"
>;

const buildHomeCatalog = unstable_cache(
  async (list: Assignment[]): Promise<HomeCatalogProduct[]> => {
    // A home só precisa de dados dos cards e das opções de compra.
    // Não carregue descrições longas, galerias, vídeos, especificações e JSON de upsell
    // de todo o catálogo para depois descartar quase tudo no componente.
    const [products, rules] = await Promise.all([
      db.product.findMany({
        where: {
          active: true,
          priceCents: { gt: 0 },
          category: { notIn: ["BEADS", "PEGBOARD", "TWEEZERS", "DIGITAL_MODELS", "KIT"] },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          slug: true,
          sku: true,
          name: true,
          sourceProductId: true,
          sourceCollectionId: true,
          sourceCollectionIds: true,
          category: true,
          priceCents: true,
          compareAtPriceCents: true,
          promoPriceCents: true,
          promoStartsAt: true,
          promoEndsAt: true,
          promoLabel: true,
          individualDiscountPercent: true,
          imageUrl: true,
          variants: true,
          badge: true,
          stockStatus: true,
          homeBlackFriday: true,
        },
      }),
      getActiveSectionDiscounts(),
    ]);

    const overrides = priceOverrides(list);
    const now = new Date();
    const discountByCategory = new Map(
      rules
        .filter((r) => (!r.startsAt || r.startsAt <= now) && (!r.endsAt || r.endsAt > now))
        .map((r) => [r.category, r.percent])
    );

    const homeProducts: HomeCatalogProduct[] = products.map((p) => {
      const sectionDiscount = discountByCategory.get(p.category) ?? null;
      const price = effectivePrice(p, overrides, now, sectionDiscount);
      const variants = asArray<ProductVariant>(p.variants)
        .filter((v) => v?.id && v?.sku && Number.isInteger(v?.priceCents))
        .map((v) => {
          const variantPrice = effectivePrice({
            ...p,
            priceCents: v.priceCents,
            compareAtPriceCents: v.listPriceCents,
            promoPriceCents: null,
            promoStartsAt: null,
            promoEndsAt: null,
            promoLabel: null,
          }, overrides, now, sectionDiscount);
          return { ...v, priceCents: variantPrice.priceCents, listPriceCents: variantPrice.listPriceCents };
        });

      return {
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        brandName: p.sourceProductId ? "Crocs" : null,
        sourceCollectionId: p.sourceCollectionId,
        sourceCollectionIds: [...new Set([...asArray<string>(p.sourceCollectionIds), ...(p.sourceCollectionId ? [p.sourceCollectionId] : [])])],
        category: p.category,
        priceCents: price.priceCents,
        listPriceCents: price.listPriceCents,
        individualDiscountPercent: p.individualDiscountPercent,
        imageUrl: p.imageUrl,
        variants,
        badge: p.badge,
        stockStatus: p.stockStatus,
        homeBlackFriday: p.homeBlackFriday,
        colorFamily: [],
      };
    });

    const familyMap = new Map<string, ProductColorFamilyItem[]>();
    const familyKeyOf = (product: Pick<HomeCatalogProduct, "category" | "name">) =>
      product.category + ":" + product.name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/\\s+/g, " ").trim();

    for (const product of homeProducts) {
      if (product.category === "JIBBITZ") continue;
      const familyKey = familyKeyOf(product);
      const family = familyMap.get(familyKey) ?? [];
      for (const value of productColorOptions(product.variants)) {
        const key = value.toLocaleLowerCase("pt-BR");
        if (family.some((item) => item.value.toLocaleLowerCase("pt-BR") === key)) continue;
        family.push({
          id: product.id,
          slug: product.slug,
          value: value || "Ver cor",
          imageUrl: product.imageUrl,
          priceCents: product.priceCents,
          listPriceCents: product.listPriceCents,
          available: product.stockStatus !== "OUT_OF_STOCK",
        });
      }
      familyMap.set(familyKey, family);
    }

    return homeProducts.map((product) => {
      if (product.category === "JIBBITZ") return product;
      return { ...product, colorFamily: familyMap.get(familyKeyOf(product)) ?? [] };
    });
  },
  ["home-catalog-by-assignment-v1"],
  { tags: ["catalog", "experiments"], revalidate: 300 }
);

export async function getHomeCatalog(assignments?: Assignment[]) {
  const list = assignments ?? await currentAssignments();
  return buildHomeCatalog(list);
}

export async function getPublicCatalog(assignments?: Assignment[]) {
  const list = assignments ?? await currentAssignments();
  return buildPublicCatalog(list);
}

const legacyCraftCategories = ["BEADS", "PEGBOARD", "TWEEZERS", "DIGITAL_MODELS", "KIT"] as const;

const getActiveProductBySlug = unstable_cache(
  async (slug: string) => db.product.findFirst({
    where: { slug, active: true, priceCents: { gt: 0 }, category: { notIn: [...legacyCraftCategories] } },
  }),
  ["active-public-product-by-slug-v1"],
  { tags: ["catalog"], revalidate: 300 }
);

const getActiveFamilyProducts = unstable_cache(
  async (category: Product["category"], name: string) => db.product.findMany({
    where: {
      active: true,
      priceCents: { gt: 0 },
      category,
      name: { equals: name, mode: "insensitive" },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      priceCents: true,
      compareAtPriceCents: true,
      promoPriceCents: true,
      promoStartsAt: true,
      promoEndsAt: true,
      promoLabel: true,
      individualDiscountPercent: true,
      imageUrl: true,
      variants: true,
      stockStatus: true,
    },
  }),
  ["active-public-product-color-family-v1"],
  { tags: ["catalog"], revalidate: 300 }
);

const getActiveRelatedProducts = unstable_cache(
  async (productId: string, category: Product["category"]) => db.product.findMany({
    where: {
      id: { not: productId },
      active: true,
      priceCents: { gt: 0 },
      category,
      stockStatus: { not: "OUT_OF_STOCK" },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 4,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      priceCents: true,
      compareAtPriceCents: true,
      promoPriceCents: true,
      promoStartsAt: true,
      promoEndsAt: true,
      promoLabel: true,
      individualDiscountPercent: true,
      imageUrl: true,
    },
  }),
  ["active-public-related-products-v1"],
  { tags: ["catalog"], revalidate: 300 }
);

const getActiveJibbitzProducts = unstable_cache(
  async () => db.product.findMany({
    where: {
      active: true,
      priceCents: { gt: 0 },
      category: "JIBBITZ",
      stockStatus: { not: "OUT_OF_STOCK" },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 10,
    select: {
      id: true,
      slug: true,
      sku: true,
      name: true,
      category: true,
      priceCents: true,
      compareAtPriceCents: true,
      promoPriceCents: true,
      promoStartsAt: true,
      promoEndsAt: true,
      promoLabel: true,
      individualDiscountPercent: true,
      imageUrl: true,
      variants: true,
      stockStatus: true,
    },
  }),
  ["active-public-jibbitz-products-v1"],
  { tags: ["catalog"], revalidate: 300 }
);

function activeSectionDiscount(
  rules: Awaited<ReturnType<typeof getActiveSectionDiscounts>>,
  category: Product["category"],
  now: Date
): number | null {
  const rule = rules.find((item) =>
    item.category === category &&
    item.active &&
    (!item.startsAt || item.startsAt <= now) &&
    (!item.endsAt || item.endsAt > now)
  );
  return rule?.percent ?? null;
}

function normalizedFamilyName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** PDP: consulta somente o produto solicitado e, quando necessário, seus modelos de cor. */
export async function getPublicProduct(slug: string, assignments?: Assignment[]) {
  const [product, list, rules] = await Promise.all([
    getActiveProductBySlug(slug),
    assignments ? Promise.resolve(assignments) : currentAssignments(),
    getActiveSectionDiscounts(),
  ]);
  if (!product) return null;

  const now = new Date();
  const overrides = priceOverrides(list);
  const publicProduct = toPublicProduct(
    product,
    overrides,
    activeSectionDiscount(rules, product.category, now),
    now
  );

  if (product.category === "JIBBITZ") return publicProduct;

  const candidates = await getActiveFamilyProducts(product.category, product.name);
  const family: ProductColorFamilyItem[] = [];
  const seen = new Set<string>();
  const familyKey = normalizedFamilyName(product.name);

  for (const candidate of candidates) {
    if (normalizedFamilyName(candidate.name) !== familyKey) continue;
    const price = effectivePrice(
      candidate,
      overrides,
      now,
      activeSectionDiscount(rules, candidate.category, now)
    );
    const colors = productColorOptions(asArray<ProductVariant>(candidate.variants));
    for (const value of colors) {
      const key = value.toLocaleLowerCase("pt-BR");
      if (seen.has(key)) continue;
      seen.add(key);
      family.push({
        id: candidate.id,
        slug: candidate.slug,
        value: value || "Ver cor",
        imageUrl: candidate.imageUrl,
        priceCents: price.priceCents,
        listPriceCents: price.listPriceCents,
        available: candidate.stockStatus !== "OUT_OF_STOCK",
      });
    }
  }

  return { ...publicProduct, colorFamily: family };
}

/** Recomendações leves do PDP: sem galeria, descrição e JSON que não são exibidos nos cards. */
export async function getPublicRelatedProducts(
  productId: string,
  category: Product["category"],
  assignments?: Assignment[]
) {
  const [products, list, rules] = await Promise.all([
    getActiveRelatedProducts(productId, category),
    assignments ? Promise.resolve(assignments) : currentAssignments(),
    getActiveSectionDiscounts(),
  ]);
  const overrides = priceOverrides(list);
  const now = new Date();

  return products
    .map((product) => {
      const price = effectivePrice(
        product,
        overrides,
        now,
        activeSectionDiscount(rules, product.category, now)
      );
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        priceCents: price.priceCents,
      };
    });
}

/** Jibbitz do PDP: no máximo dez opções com apenas os dados usados pelo seletor. */
export async function getPublicJibbitzProducts(assignments?: Assignment[]) {
  const [products, list, rules] = await Promise.all([
    getActiveJibbitzProducts(),
    assignments ? Promise.resolve(assignments) : currentAssignments(),
    getActiveSectionDiscounts(),
  ]);
  const overrides = priceOverrides(list);
  const now = new Date();

  return products
    .map((product) => {
      const basePrice = effectivePrice(
        product,
        overrides,
        now,
        activeSectionDiscount(rules, product.category, now)
      );
      const variants = asArray<ProductVariant>(product.variants);
      const variant = variants.find((item) => item.available && item.stockQuantity > 0);
      const variantPrice = variant
        ? effectivePrice({
            ...product,
            priceCents: variant.priceCents,
            compareAtPriceCents: variant.listPriceCents,
            promoPriceCents: null,
            promoStartsAt: null,
            promoEndsAt: null,
            promoLabel: null,
          }, overrides, now, activeSectionDiscount(rules, product.category, now))
        : null;

      return {
        id: product.id,
        name: product.name,
        sku: variant?.sku ?? product.sku,
        priceCents: variantPrice?.priceCents ?? basePrice.priceCents,
        imageUrl: product.imageUrl,
        variantId: variant?.id ?? null,
      };
    });
}

