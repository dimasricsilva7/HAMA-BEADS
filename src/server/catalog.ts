import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import type { Product } from "@prisma/client";
import { db } from "@/lib/db";
import { assignAll, priceOverrides, type Assignment, type ExperimentDef, type ExperimentVariant } from "@/lib/experiments";
import { effectivePrice } from "@/lib/pricing";
import type { GalleryImage, ProductComponent, ProductSpec } from "@/lib/domain";
import type { PublicProduct } from "@/types/catalog";

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Produtos ativos (cache invalidado pela tag "catalog" em qualquer edição no admin). */
export const getActiveProducts = unstable_cache(
  async () => db.product.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ["active-products"],
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

export function toPublicProduct(p: Product, overrides: Record<string, number> = {}): PublicProduct {
  const price = effectivePrice(p, overrides);
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    category: p.category,
    fulfillment: p.fulfillment,
    shortDescription: p.shortDescription,
    description: p.description,
    priceCents: price.priceCents,
    listPriceCents: price.listPriceCents,
    promoLabel: price.promoLabel,
    promoEndsAt: price.promoEndsAt,
    beadCount: p.beadCount,
    colorCount: p.colorCount,
    pegboardCount: p.pegboardCount,
    modelCount: p.modelCount,
    components: asArray<ProductComponent>(p.components),
    specs: asArray<ProductSpec>(p.specs).filter((s) => s?.label && s?.value),
    imageUrl: p.imageUrl,
    gallery: asArray<GalleryImage>(p.gallery).filter((g) => g?.url),
    videoUrl: p.videoUrl,
    badge: p.badge,
    featured: p.featured,
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

export async function getPublicCatalog(assignments?: Assignment[]) {
  const [products, list] = await Promise.all([getActiveProducts(), assignments ? Promise.resolve(assignments) : currentAssignments()]);
  const overrides = priceOverrides(list);
  return products.filter((p) => p.priceCents > 0).map((p) => toPublicProduct(p, overrides));
}

export async function getPublicProduct(slug: string) {
  const products = await getPublicCatalog();
  return products.find((p) => p.slug === slug) ?? null;
}
