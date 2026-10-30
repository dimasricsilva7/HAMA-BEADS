import { NextResponse, type NextRequest } from "next/server";
import { ProductCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CROCS_ORIGIN = "https://www.crocs.com.br";
const PAGE_SIZE = 50;
const COLLECTIONS = new Set(["596", "597", "469"]);

type VtexOffer = {
  Price?: number;
  ListPrice?: number;
  AvailableQuantity?: number;
  IsAvailable?: boolean;
};
type VtexItem = {
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
  items?: VtexItem[];
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
}
function cents(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}
function imageUrl(items: VtexItem[]): string | null {
  for (const item of items) {
    const url = item.images?.find((x) => x.imageUrl)?.imageUrl;
    if (url && /^https:\/\//.test(url)) return url;
  }
  return null;
}
function itemOptions(item: VtexItem) {
  if (item.variations && !Array.isArray(item.variations) && typeof item.variations === "object") {
    return Object.entries(item.variations as Record<string, unknown>).flatMap(([name, raw]) => {
      const value = Array.isArray(raw) ? raw[0] : raw;
      return value == null || String(value).trim() === "" ? [] : [{ name, value: String(value) }];
    });
  }
  const names = Array.isArray(item.variations) ? item.variations : [];
  const values = Array.isArray(item.variationValues) ? item.variationValues : [];
  const valueMap = item.variationValues && typeof item.variationValues === "object" && !Array.isArray(item.variationValues)
    ? item.variationValues as Record<string, unknown>
    : {};
  return names.flatMap((name, i) => {
    const value = values[i] ?? valueMap[String(name)];
    return value == null || String(value).trim() === "" ? [] : [{ name: String(name), value: String(value) }];
  });
}
function referenceSku(item: VtexItem) {
  if (typeof item.referenceId === "string") return item.referenceId;
  if (Array.isArray(item.referenceId)) return item.referenceId.find((x) => x?.Key === "RefId")?.Value ?? item.referenceId[0]?.Value ?? "";
  return "";
}
function productCategory(p: VtexProduct, collectionId: string): ProductCategory {
  if (collectionId === "469") return "JIBBITZ";
  if (collectionId === "597") return "KIDS";
  const text = [p.productName, p.productTitle, ...(p.categories ?? [])].join(" ").toLowerCase();
  if (/jibbitz|charm|pin\b|enfeite/.test(text)) return "JIBBITZ";
  if (/slide|mellow slide/.test(text)) return "SLIDES";
  if (/sandal|sandália|sandalia|flip|chinelo/.test(text)) return "SANDALS";
  if (/tennis|tênis|tenis|sneaker|pacer|runner/.test(text)) return "FOOTWEAR";
  return "CLOGS";
}
function normalizeProduct(p: VtexProduct, collectionId: string) {
  const productId = String(p.productId ?? "").trim();
  const name = String(p.productName ?? p.productTitle ?? "").trim();
  if (!productId || !name) return null;
  const items = Array.isArray(p.items) ? p.items : [];
  const variants = items.flatMap((item) => {
    const id = String(item.itemId ?? "").trim();
    if (!id) return [];
    const offer = item.sellers?.find((s) => s.commertialOffer)?.commertialOffer ?? {};
    const priceCents = cents(offer.Price);
    const listPriceCents = cents(offer.ListPrice);
    const stockQuantity = Math.max(0, Math.floor(Number(offer.AvailableQuantity) || 0));
    const available = Boolean(offer.IsAvailable) && stockQuantity > 0 && priceCents > 0;
    const firstImage = item.images?.find((x) => x.imageUrl)?.imageUrl ?? null;
    const options = itemOptions(item);
    return [{
      id,
      sku: referenceSku(item) || id,
      label: item.nameComplete || item.name || options.map((x) => x.value).join(" / ") || name,
      options,
      imageUrl: firstImage && /^https:\/\//.test(firstImage) ? firstImage : null,
      priceCents,
      listPriceCents: listPriceCents > priceCents ? listPriceCents : null,
      stockQuantity,
      available,
    }];
  });
  const priced = variants.filter((v) => v.priceCents > 0);
  const inStock = priced.filter((v) => v.available);
  const priceCents = (inStock.length ? inStock : priced).reduce((min, v) => Math.min(min, v.priceCents), Number.MAX_SAFE_INTEGER);
  const listPriceCents = priced.reduce((max, v) => Math.max(max, v.listPriceCents ?? 0), 0);
  const gallery = [...new Set(items.flatMap((item) => (item.images ?? []).flatMap((img) => img.imageUrl && /^https:\/\//.test(img.imageUrl) ? [img.imageUrl] : [])))].slice(0, 12)
    .map((url) => ({ url, alt: name }));
  const linkText = slugify(String(p.linkText ?? name));
  const rawDescription = String(p.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const sourceUrl = p.link?.startsWith("https://") ? p.link : `${CROCS_ORIGIN}/${linkText}/p`;
  const stockQuantity = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  return {
    productId,
    name,
    slug: `${linkText || "produto"}-${productId}`,
    sku: `CROCS-${productId}`,
    category: productCategory(p, collectionId),
    priceCents: Number.isFinite(priceCents) && priceCents !== Number.MAX_SAFE_INTEGER ? priceCents : 0,
    compareAtPriceCents: listPriceCents > priceCents ? listPriceCents : null,
    stockQuantity,
    stockStatus: stockQuantity > 0 ? "IN_STOCK" as const : "OUT_OF_STOCK" as const,
    imageUrl: imageUrl(items),
    gallery,
    variants,
    shortDescription: rawDescription.slice(0, 220) || null,
    description: rawDescription || null,
    sourceUrl,
  };
}

async function saveOne(p: VtexProduct, collectionId: string, sortOrder: number) {
  const x = normalizeProduct(p, collectionId);
  if (!x) return "skipped" as const;
  if (x.priceCents <= 0) return "skipped" as const;
  const existing = await db.product.findUnique({ where: { sourceProductId: x.productId }, select: { id: true } });
  const data = {
    name: x.name,
    slug: x.slug,
    sku: x.sku,
    category: x.category,
    fulfillment: "PHYSICAL" as const,
    shortDescription: x.shortDescription,
    description: x.description,
    priceCents: x.priceCents,
    compareAtPriceCents: x.compareAtPriceCents,
    individualDiscountPercent: null,
    imageUrl: x.imageUrl,
    gallery: x.gallery,
    variants: x.variants,
    stockQuantity: x.stockQuantity,
    stockStatus: x.stockStatus,
    active: true,
    sourceUrl: x.sourceUrl,
    sourceCollectionId: collectionId,
    sourceSyncedAt: new Date(),
    sortOrder,
  };
  await db.product.upsert({
    where: { sourceProductId: x.productId },
    update: data,
    create: { ...data, sourceProductId: x.productId, featured: false },
  });
  return existing ? "updated" as const : "created" as const;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const admin = await getCurrentAdmin();
  if (!admin || !["OWNER", "ADMIN"].includes(admin.role)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const body = await req.json().catch(() => null) as { collectionId?: unknown; from?: unknown } | null;
  const collectionId = String(body?.collectionId ?? "");
  const from = Number(body?.from ?? 0);
  if (!COLLECTIONS.has(collectionId) || !Number.isInteger(from) || from < 0 || from % PAGE_SIZE !== 0 || from > 5000) {
    return NextResponse.json({ error: "Coleção ou página inválida." }, { status: 400 });
  }

  const url = new URL("/api/catalog_system/pub/products/search", CROCS_ORIGIN);
  url.searchParams.set("fq", `productClusterIds:${collectionId}`);
  url.searchParams.set("_from", String(from));
  url.searchParams.set("_to", String(from + PAGE_SIZE - 1));

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "FootwearCatalogSync/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      log.error("catalog-sync", "Crocs VTEX retornou erro", { status: response.status, collectionId, from });
      return NextResponse.json({ error: `Catálogo de origem respondeu com status ${response.status}.` }, { status: 502 });
    }
    const products = await response.json() as VtexProduct[];
    if (!Array.isArray(products)) return NextResponse.json({ error: "Formato inesperado do catálogo de origem." }, { status: 502 });

    const resourcesHeader = response.headers.get("resources") ?? "";
    const totalPart = resourcesHeader.split("/").at(-1) ?? "";
    const total = /^\d+$/.test(totalPart) ? Number(totalPart) : null;
    let created = 0, updated = 0, skipped = 0;
    for (let i = 0; i < products.length; i += 5) {
      const chunk = products.slice(i, i + 5);
      const outcomes = await Promise.all(chunk.map((p, j) => saveOne(p, collectionId, from + i + j)));
      for (const outcome of outcomes) {
        if (outcome === "created") created++;
        else if (outcome === "updated") updated++;
        else skipped++;
      }
    }
    return NextResponse.json({
      collectionId,
      from,
      fetched: products.length,
      total,
      created,
      updated,
      skipped,
      nextFrom: products.length === PAGE_SIZE ? from + PAGE_SIZE : null,
      done: products.length < PAGE_SIZE,
      at: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    log.error("catalog-sync", "Falha ao sincronizar catálogo Crocs", { collectionId, from, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Não foi possível consultar o catálogo agora. Tente novamente." }, { status: 502 });
  }
}
