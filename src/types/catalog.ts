import type { GalleryImage, ProductComponent, ProductSpec } from "@/lib/domain";

export type PublicProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: "KIT" | "PEGBOARD" | "TWEEZERS" | "DIGITAL_MODELS" | "ACCESSORY" | "TOOL" | "OTHER";
  fulfillment: "PHYSICAL" | "DIGITAL" | "HYBRID";
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  listPriceCents: number | null;
  promoLabel: string | null;
  promoEndsAt: string | null;
  beadCount: number | null;
  colorCount: number | null;
  pegboardCount: number | null;
  modelCount: number | null;
  components: ProductComponent[];
  specs: ProductSpec[];
  imageUrl: string | null;
  gallery: GalleryImage[];
  videoUrl: string | null;
  badge: string | null;
  featured: boolean;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  crossSellIds: string[];
  includedProductIds: string[];
  digitalDeliveryNote: string | null;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  category: PublicProduct["category"];
  fulfillment: PublicProduct["fulfillment"];
  quantity: number;
  unitPriceCents: number;
  listPriceCents: number | null;
  totalCents: number;
  kind: "PRODUCT" | "ORDER_BUMP" | "CROSS_SELL";
  orderBumpId?: string;
};

export type QuoteBump = {
  id: string;
  productId: string;
  title: string;
  description: string | null;
  benefit: string | null;
  imageUrl: string | null;
  priceCents: number;
  listPriceCents: number | null;
  selected: boolean;
};

export type CartQuote = {
  lines: QuoteLine[];
  bumps: QuoteBump[];
  crossSells: PublicProduct[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  coupon: { code: string; valid: boolean; message: string | null } | null;
  requiresShipping: boolean;
  removed: string[];
};
