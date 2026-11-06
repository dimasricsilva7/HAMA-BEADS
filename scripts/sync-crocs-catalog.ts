import { Prisma, PrismaClient, ProductCategory } from "@prisma/client";
import { crocsCategoryCollectionIds } from "../src/lib/crocs-catalog";

const db = new PrismaClient();
const ORIGIN = "https://www.crocs.com.br";
const PAGE_SIZE = 50;
const CATEGORY_COLLECTIONS = [
  { id: "111", label: "Feminino" },
  { id: "146", label: "Masculino" },
  { id: "173", label: "Kids" },
  { id: "215", label: "Jibbitz" },
  { id: "225", label: "Crocs At Work" },
  { id: "1792513037", label: "Bolsas e Acessórios" },
] as const;
const CAMPAIGN_COLLECTIONS = [
  { id: "595", label: "Esquenta Black Friday" },
  { id: "596", label: "Ofertas Black adulto" },
  { id: "599", label: "Ofertas Black" },
] as const;

type VtexOffer = { Price?: number; ListPrice?: number; AvailableQuantity?: number; IsAvailable?: boolean };
type VtexItem = {
  [key: string]: unknown;
  itemId?: string;
  name?: string;
  nameComplete?: string;
  referenceId?: string | { Key?: string; Value?: string }[];
  variations?: unknown;
  variationValues?: unknown;
  images?: { imageUrl?: string; imageText?: string }[];
  sellers?: { commertialOffer?: VtexOffer }[];
};
type VtexProduct = {
  productId?: string | number;
  productName?: string;
  productTitle?: string;
  linkText?: string;
  link?: string;
  description?: string;
  categories?: string[];
  categoriesIds?: string[];
  items?: VtexItem[];
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
}
function cents(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0;
}
function firstImage(items: VtexItem[]): string | null {
  for (const item of items) {
    const url = item.images?.find((image) => image.imageUrl)?.imageUrl;
    if (url && /^https:\/\//.test(url)) return url;
  }
  return null;
}
function itemOptions(item: VtexItem) {
  const names = Array.isArray(item.variations) ? item.variations.map(String) : [];
  const values = Array.isArray(item.variationValues) ? item.variationValues : [];
  const valueMap = item.variationValues && typeof item.variationValues === "object" && !Array.isArray(item.variationValues)
    ? item.variationValues as Record<string, unknown> : {};
  const dynamic = item.variations && !Array.isArray(item.variations) && typeof item.variations === "object"
    ? item.variations as Record<string, unknown> : {};
  return names.flatMap((name, index) => {
    const raw = item[name] ?? dynamic[name] ?? values[index] ?? valueMap[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value == null || String(value).trim() === "" ? [] : [{ name, value: String(value) }];
  });
}
function referenceSku(item: VtexItem) {
  if (typeof item.referenceId === "string") return item.referenceId;
  if (Array.isArray(item.referenceId)) return item.referenceId.find((x) => x?.Key === "RefId")?.Value ?? item.referenceId[0]?.Value ?? "";
  return "";
}
function categoryFor(product: VtexProduct, collectionId: string): ProductCategory {
  if (collectionId === "215") return "JIBBITZ";
  if (collectionId === "173") return "KIDS";
  if (collectionId === "1792513037") return "ACCESSORY";
  const name = [product.productName, product.productTitle].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/jibbitz|charm|pin\b|enfeite/.test(name)) return "JIBBITZ";
  if (/bolsa|bag\b|carteira|pochete|mochila|necessaire|chaveiro|meia/.test(name)) return "ACCESSORY";
  if (/\bclog\b/.test(name)) return "CLOGS";
  if (/\bslide\b/.test(name)) return "SLIDES";
  if (/sandal|\bflip\b|chinelo/.test(name)) return "SANDALS";
  if (/tennis|\btenis\b|sneaker|pacer|runner/.test(name)) return "FOOTWEAR";
  const taxonomy = (product.categories ?? []).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/jibbitz|charm|pin\b|enfeite/.test(taxonomy)) return "JIBBITZ";
  if (/bolsas|acessorios|meias/.test(taxonomy)) return "ACCESSORY";
  return "CLOGS";
}
function normalize(product: VtexProduct, collectionId: string) {
  const productId = String(product.productId ?? "").trim();
  const name = String(product.productName ?? product.productTitle ?? "").trim();
  if (!productId || !name) return null;
  const items = Array.isArray(product.items) ? product.items : [];
  const variants = items.flatMap((item) => {
    const id = String(item.itemId ?? "").trim();
    if (!id) return [];
    const offer = item.sellers?.find((seller) => seller.commertialOffer)?.commertialOffer ?? {};
    const priceCents = cents(offer.Price);
    const listPriceCents = cents(offer.ListPrice);
    const sourceStockQuantity = Math.max(0, Math.floor(Number(offer.AvailableQuantity) || 0));
    const image = item.images?.find((x) => x.imageUrl)?.imageUrl ?? null;
    const options = itemOptions(item);
    const hasSize = options.some((option) => {
      const dimension = option.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      return dimension.includes("size") || dimension.includes("tamanho") || dimension.includes("numera") || dimension === "eu";
    });
    // O estoque de numerações é mantido pela operação própria da loja,
    // conforme confirmado pelo responsável, e não pelo saldo do catálogo externo.
    const stockQuantity = hasSize ? Math.max(1, sourceStockQuantity) : sourceStockQuantity;
    const available = priceCents > 0 && (hasSize || (Boolean(offer.IsAvailable) && sourceStockQuantity > 0));
    return [{
      id,
      sku: referenceSku(item) || id,
      label: item.nameComplete || item.name || options.map((option) => option.value).join(" / ") || name,
      options,
      imageUrl: image && /^https:\/\//.test(image) ? image : null,
      priceCents,
      listPriceCents: listPriceCents > priceCents ? listPriceCents : null,
      stockQuantity,
      available,
    }];
  });
  const priced = variants.filter((variant) => variant.priceCents > 0);
  const inStock = priced.filter((variant) => variant.available);
  const source = inStock.length ? inStock : priced;
  const lowest = source.slice().sort((a, b) => a.priceCents - b.priceCents)[0];
  const priceCents = lowest?.priceCents ?? 0;
  const listPriceCents = lowest && (lowest.listPriceCents ?? 0) > lowest.priceCents ? lowest.listPriceCents ?? 0 : 0;
  const gallery = [...new Set(items.flatMap((item) => (item.images ?? []).flatMap((image) =>
    image.imageUrl && /^https:\/\//.test(image.imageUrl) ? [image.imageUrl] : []
  )))].map((url) => ({ url, alt: name }));
  const linkText = slugify(String(product.linkText ?? name));
  const description = String(product.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const sourceUrl = product.link?.startsWith("https://") ? product.link : `${ORIGIN}/${linkText}/p`;
  const stockQuantity = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  return {
    productId,
    name,
    slug: `${linkText || "produto"}-${productId}`,
    sku: `CROCS-${productId}`,
    category: categoryFor(product, collectionId),
    priceCents,
    compareAtPriceCents: listPriceCents > priceCents ? listPriceCents : null,
    stockQuantity,
    stockStatus: stockQuantity > 0 ? "IN_STOCK" as const : "OUT_OF_STOCK" as const,
    imageUrl: firstImage(items),
    gallery,
    variants,
    shortDescription: description.slice(0, 220) || null,
    description: description || null,
    sourceUrl,
  };
}

async function fetchPage(collectionId: string, from: number, kind: "category" | "campaign") {
  const url = new URL("/api/catalog_system/pub/products/search", ORIGIN);
  url.searchParams.set("fq", kind === "category" ? `C:/${collectionId}/` : `productClusterIds:${collectionId}`);
  url.searchParams.set("_from", String(from));
  url.searchParams.set("_to", String(from + PAGE_SIZE - 1));
  let lastError = "Erro desconhecido";
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "FootwearCatalogSync/2.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      });
      if (response.ok) {
        const items = await response.json() as VtexProduct[];
        if (!Array.isArray(items)) throw new Error("A API VTEX retornou um formato inesperado.");
        const totalPart = (response.headers.get("resources") ?? "").split("/").at(-1) ?? "";
        return { items, total: /^\d+$/.test(totalPart) ? Number(totalPart) : null };
      }
      lastError = `HTTP ${response.status}`;
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await pause(1200 * (attempt + 1));
  }
  throw new Error(`Falha consultando a coleção ${collectionId}, página ${from}: ${lastError}`);
}

async function saveProduct(product: VtexProduct, collectionId: string, sortOrder: number, kind: "category" | "campaign") {
  const item = normalize(product, collectionId);
  if (!item || item.priceCents <= 0) return "skipped" as const;
  const existing = await db.product.findUnique({
    where: { sourceProductId: item.productId },
    select: {
      active: true,
      individualDiscountPercent: true,
      badge: true,
      sourceCollectionId: true,
      sourceCollectionIds: true,
    },
  });
  const storedMemberships = Array.isArray(existing?.sourceCollectionIds)
    ? existing.sourceCollectionIds.filter((value): value is string => typeof value === "string")
    : [];
  const categoryIdsFromSource = crocsCategoryCollectionIds(product.categoriesIds);
  const previousCategoryIds = storedMemberships.filter((id) => CATEGORY_COLLECTIONS.some((group) => group.id === id));
  const categoryMemberships = categoryIdsFromSource.length
    ? categoryIdsFromSource
    : previousCategoryIds.length
      ? previousCategoryIds
      : kind === "category" ? [collectionId] : [];
  const campaignMemberships = storedMemberships.filter((id) => CAMPAIGN_COLLECTIONS.some((group) => group.id === id));
  const memberships = [...new Set([
    ...categoryMemberships,
    ...campaignMemberships,
    ...(kind === "campaign" ? [collectionId] : []),
  ])];
  const primaryCategoryId =
    (existing?.sourceCollectionId && categoryMemberships.includes(existing.sourceCollectionId) ? existing.sourceCollectionId : null) ??
    (categoryMemberships.includes("146") ? "146" : categoryMemberships[0] ?? null);
  const isCampaign = kind === "campaign";
  const data = {
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    category: item.category,
    fulfillment: "PHYSICAL" as const,
    shortDescription: item.shortDescription,
    description: item.description,
    priceCents: item.priceCents,
    compareAtPriceCents: item.compareAtPriceCents,
    badge: isCampaign ? "BLACK FRIDAY" : existing?.badge ?? null,
    individualDiscountPercent: existing?.individualDiscountPercent ?? null,
    imageUrl: item.imageUrl,
    gallery: item.gallery as Prisma.InputJsonValue,
    variants: item.variants as Prisma.InputJsonValue,
    stockQuantity: item.stockQuantity,
    stockStatus: item.stockStatus,
    active: existing?.active ?? true,
    sourceUrl: item.sourceUrl,
    sourceCollectionId: primaryCategoryId,
    sourceCollectionIds: memberships as Prisma.InputJsonValue,
    sourceSyncedAt: new Date(),
    sortOrder,
  };
  await db.product.upsert({
    where: { sourceProductId: item.productId },
    update: data,
    create: { ...data, sourceProductId: item.productId, featured: false },
  });
  return existing ? "updated" as const : "created" as const;
}

async function syncGroup(group: { id: string; label: string }, kind: "category" | "campaign", overall: {
  products: number; variants: number; images: number; created: number; updated: number; skipped: number;
}) {
  let from = 0;
  let fetched = 0;
  let total: number | null = null;
  while (true) {
    const page = await fetchPage(group.id, from, kind);
    total = page.total ?? total;
    fetched += page.items.length;
    overall.variants += page.items.reduce((sum, product) => sum + (product.items?.length ?? 0), 0);
    overall.images += page.items.reduce((sum, product) => sum + (product.items ?? []).reduce((count, item) => count + (item.images?.length ?? 0), 0), 0);

    for (let index = 0; index < page.items.length; index += 5) {
      const chunk = page.items.slice(index, index + 5);
      const outcomes = await Promise.all(chunk.map((product, offset) =>
        saveProduct(product, group.id, from + index + offset, kind)
      ));
      for (const outcome of outcomes) {
        if (outcome === "created") overall.created++;
        else if (outcome === "updated") overall.updated++;
        else overall.skipped++;
      }
    }
    console.info(JSON.stringify({ group: group.label, id: group.id, fetched, total, created: overall.created, updated: overall.updated }));
    if (page.items.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    await pause(180);
  }
  overall.products += fetched;
  console.info(`CATALOG_GROUP_DONE ${group.label} ${fetched}/${total ?? "?"}`);
}

async function main() {
  const overall = { products: 0, variants: 0, images: 0, created: 0, updated: 0, skipped: 0 };
  try {
    for (const group of CATEGORY_COLLECTIONS) await syncGroup(group, "category", overall);
    for (const group of CAMPAIGN_COLLECTIONS) await syncGroup(group, "campaign", overall);
    console.info("CATALOG_SYNC_SUMMARY " + JSON.stringify(overall));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("CATALOG_SYNC_FAILED", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
