import { Prisma, PrismaClient } from "@prisma/client";
import { CROCS_CAMPAIGN_COLLECTION_IDS, crocsCategoryCollectionIds } from "../src/lib/crocs-catalog";

const db = new PrismaClient();
const ORIGIN = "https://www.crocs.com.br";
const PRODUCTS = [
  "https://www.crocs.com.br/sandalia-crocs-bayaband-clog-winter-white-multi-205089_8793/p",
  "https://www.crocs.com.br/sandalia-crocs-crocband-clog-black-11016_4891/p",
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
  categoriesIds?: string[];
  items?: VtexItem[];
};
type Variant = {
  id: string; sku: string; label: string;
  options: { name: string; value: string }[];
  imageUrl: string | null; priceCents: number; listPriceCents: number | null;
  stockQuantity: number; available: boolean;
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100);
}
function cents(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;
}
function optionsOf(item: VtexItem) {
  const names = Array.isArray(item.variations) ? item.variations.map(String) : [];
  const values = Array.isArray(item.variationValues) ? item.variationValues : [];
  const valueMap = item.variationValues && typeof item.variationValues === "object" && !Array.isArray(item.variationValues)
    ? item.variationValues as Record<string, unknown> : {};
  const dynamic = item.variations && typeof item.variations === "object" && !Array.isArray(item.variations)
    ? item.variations as Record<string, unknown> : {};
  return names.flatMap((name, index) => {
    const raw = item[name] ?? dynamic[name] ?? values[index] ?? valueMap[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value == null || String(value).trim() === "" ? [] : [{ name, value: String(value) }];
  });
}
function referenceSku(item: VtexItem) {
  if (typeof item.referenceId === "string") return item.referenceId;
  if (Array.isArray(item.referenceId)) return item.referenceId.find((value) => value?.Key === "RefId")?.Value ?? item.referenceId[0]?.Value ?? "";
  return "";
}
async function fetchExactProduct(productUrl: string): Promise<VtexProduct> {
  const parsed = new URL(productUrl);
  if (parsed.origin !== ORIGIN || !parsed.pathname.endsWith("/p")) throw new Error("URL Crocs inválida.");
  const requestedSlug = parsed.pathname.split("/").filter(Boolean).at(-2) ?? "";
  const styleCode = requestedSlug.match(/(\d{4,}[_-]\d{3,})$/)?.[1]?.replace("-", "_");
  if (!styleCode) throw new Error(`Não foi possível extrair o código do produto: ${productUrl}`);

  const endpoint = new URL("/api/catalog_system/pub/products/search", ORIGIN);
  endpoint.searchParams.set("ft", styleCode);
  endpoint.searchParams.set("_from", "0");
  endpoint.searchParams.set("_to", "49");
  let response: Response | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": "FootwearRequestedCatalogImport/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(18_000),
    });
    lastStatus = response.status;
    if (response.ok || (response.status < 500 && response.status !== 429)) break;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }
  if (!response?.ok) throw new Error(`Crocs API respondeu HTTP ${lastStatus} para ${styleCode}.`);
  const results = await response.json() as VtexProduct[];
  if (!Array.isArray(results)) throw new Error("Resposta da Crocs em formato inválido.");
  const target = slugify(requestedSlug);
  const product = results.find((item) => slugify(String(item.linkText ?? "")) === target);
  if (!product) throw new Error(`Produto ${styleCode} não encontrado na origem Crocs.`);
  return product;
}

async function importProduct(productUrl: string) {
  const product = await fetchExactProduct(productUrl);
  const productId = String(product.productId ?? "").trim();
  const name = String(product.productName ?? product.productTitle ?? "").trim();
  if (!productId || !name) throw new Error("Produto de origem sem identificador ou nome.");
  const categoryIds = crocsCategoryCollectionIds(product.categoriesIds);
  if (!categoryIds.length) throw new Error(`A origem não informou uma categoria de loja para ${name}.`);

  const rawItems = Array.isArray(product.items) ? product.items : [];
  const variants: Variant[] = rawItems.flatMap((item) => {
    const id = String(item.itemId ?? "").trim();
    if (!id) return [];
    const offer = item.sellers?.find((seller) => seller.commertialOffer)?.commertialOffer ?? {};
    const priceCents = cents(offer.Price);
    if (priceCents <= 0) return [];
    const listPriceCents = cents(offer.ListPrice);
    const sourceQuantity = Math.max(0, Math.floor(Number(offer.AvailableQuantity) || 0));
    const options = optionsOf(item);
    const hasSize = options.some((option) => {
      const dimension = option.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      return dimension.includes("size") || dimension.includes("tamanho") || dimension.includes("numera") || dimension === "eu";
    });
    // Estoque de numerações confirmado pelo responsável da loja: disponibilizar todos os tamanhos.
    const stockQuantity = hasSize ? Math.max(1, sourceQuantity) : sourceQuantity;
    const available = hasSize || (Boolean(offer.IsAvailable) && sourceQuantity > 0);
    const image = item.images?.find((entry) => entry.imageUrl)?.imageUrl ?? null;
    return [{
      id, sku: referenceSku(item) || id,
      label: item.nameComplete || item.name || options.map((option) => option.value).join(" / ") || name,
      options, imageUrl: image && /^https:\/\//.test(image) ? image : null,
      priceCents,
      listPriceCents: listPriceCents > priceCents ? listPriceCents : null,
      stockQuantity, available,
    }];
  });
  const priced = variants.filter((variant) => variant.priceCents > 0);
  const available = priced.filter((variant) => variant.available);
  const selected = (available.length ? available : priced).slice().sort((a, b) => a.priceCents - b.priceCents)[0];
  if (!selected) throw new Error(`Produto ${name} não possui preço válido.`);
  const gallery = [...new Set(rawItems.flatMap((item) =>
    (item.images ?? []).flatMap((image) => image.imageUrl && /^https:\/\//.test(image.imageUrl) ? [image.imageUrl] : []),
  ))].map((url) => ({ url, alt: name }));
  const sourceCollectionIds = categoryIds;
  const sourceCollectionId = categoryIds.includes("146") ? "146" : categoryIds[0];
  const stockQuantity = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  const compareAtPriceCents = selected.listPriceCents && selected.listPriceCents > selected.priceCents ? selected.listPriceCents : null;
  const existing = await db.product.findUnique({
    where: { sourceProductId: productId },
    select: { id: true, priceCents: true, sourceCollectionId: true, sourceCollectionIds: true, sortOrder: true },
  });
  const previousCampaigns = Array.isArray(existing?.sourceCollectionIds)
    ? existing.sourceCollectionIds.filter((id): id is string => typeof id === "string" && (CROCS_CAMPAIGN_COLLECTION_IDS as readonly string[]).includes(id))
    : [];
  const memberships = [...new Set([...sourceCollectionIds, ...previousCampaigns])];
  const primaryCollection = existing?.sourceCollectionId && categoryIds.includes(existing.sourceCollectionId)
    ? existing.sourceCollectionId : sourceCollectionId;
  const linkText = String(product.linkText ?? slugify(name));
  const description = String(product.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const data = {
    name,
    slug: `${slugify(linkText)}-${productId}`,
    sku: `CROCS-${productId}`,
    category: "CLOGS" as const,
    fulfillment: "PHYSICAL" as const,
    shortDescription: description.slice(0, 220) || null,
    description: description || null,
    priceCents: selected.priceCents,
    compareAtPriceCents,
    imageUrl: rawItems.flatMap((item) => item.images ?? []).find((image) => image.imageUrl)?.imageUrl ?? null,
    gallery: gallery as unknown as Prisma.InputJsonValue,
    variants: variants as unknown as Prisma.InputJsonValue,
    stockQuantity,
    stockStatus: stockQuantity > 0 ? "IN_STOCK" as const : "OUT_OF_STOCK" as const,
    active: true,
    sourceUrl: product.link?.startsWith("https://") ? product.link : productUrl,
    sourceCollectionId: primaryCollection,
    sourceCollectionIds: memberships as unknown as Prisma.InputJsonValue,
    sourceSyncedAt: new Date(),
    sortOrder: existing?.sortOrder ?? 0,
  };
  const saved = await db.product.upsert({
    where: { sourceProductId: productId },
    create: { ...data, sourceProductId: productId, featured: false, homeBlackFriday: false, homeFeaturedOffer: false },
    update: data,
  });
  if (!existing) {
    await db.priceHistory.create({ data: { productId: saved.id, oldPriceCents: null, newPriceCents: selected.priceCents } });
  } else if (existing.priceCents !== selected.priceCents) {
    await db.priceHistory.create({ data: { productId: saved.id, oldPriceCents: existing.priceCents, newPriceCents: selected.priceCents } });
  }
  console.info("REQUESTED_CROCS_PRODUCT_IMPORTED " + JSON.stringify({
    name, productId, status: existing ? "updated" : "created", sourceCollectionIds: memberships,
    priceCents: selected.priceCents, compareAtPriceCents, variants: variants.length,
  }));
}

async function main() {
  if (process.env.VERCEL_ENV !== "production" && process.env.IMPORT_REQUESTED_CROCS_PRODUCTS !== "1") {
    console.info("REQUESTED_CROCS_PRODUCTS_SKIPPED outside production build");
    return;
  }
  try {
    for (const productUrl of PRODUCTS) await importProduct(productUrl);
  } finally {
    await db.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("REQUESTED_CROCS_PRODUCTS_FAILED", error instanceof Error ? error.message : String(error));
  await db.$disconnect().catch(() => {});
  process.exitCode = 1;
});
