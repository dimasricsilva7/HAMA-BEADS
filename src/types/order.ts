export type PublicOrderItem = {
  name: string;
  kind: "PRODUCT" | "ORDER_BUMP" | "UPSELL" | "CROSS_SELL";
  fulfillment: "PHYSICAL" | "DIGITAL" | "HYBRID";
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
};

export type PublicDigitalAccess = {
  name: string;
  token: string;
  available: boolean;
  note: string | null;
  downloads: number;
  maxDownloads: number | null;
  expiresAt: string | null;
};

export type PublicUpsell = {
  id: string;
  headline: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  productName: string;
  priceCents: number;
  listPriceCents: number | null;
  position: number;
};

export type PublicOrder = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  crediario: { methodLabel: string; installmentLabel: string } | null;
  source: "STOREFRONT" | "UPSELL";
  parent: { orderNumber: string; token: string } | null;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  couponCode: string | null;
  pixCopyPaste: string | null;
  pixExpiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  metaEventId: string | null;
  customerFirstName: string;
  trackingCode: string | null;
  pixError: boolean;
  items: PublicOrderItem[];
  digital: PublicDigitalAccess[];
  requiresShipping: boolean;
};
