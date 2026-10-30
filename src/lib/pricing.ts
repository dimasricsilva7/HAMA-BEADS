/** Regras de preço e totais — puras, usadas no servidor (fonte da verdade) e nos testes. */

export type PriceSource = {
  id: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  promoPriceCents: number | null;
  promoStartsAt: Date | string | null;
  promoEndsAt: Date | string | null;
  promoLabel?: string | null;
  individualDiscountPercent?: number | null;
};

export type EffectivePrice = {
  priceCents: number;
  /** Preço "de" exibido riscado — só quando realmente maior que o preço atual */
  listPriceCents: number | null;
  promoActive: boolean;
  promoLabel: string | null;
  promoEndsAt: string | null;
};

const toDate = (d: Date | string | null) => (d ? new Date(d) : null);

/** Promoção só vale dentro da janela configurada. Sem contagem regressiva falsa. */
export function isPromoActive(p: PriceSource, now = new Date()): boolean {
  if (p.promoPriceCents == null || p.promoPriceCents <= 0) return false;
  const start = toDate(p.promoStartsAt);
  const end = toDate(p.promoEndsAt);
  if (!start || !end) return false;
  return now >= start && now < end;
}

export function effectivePrice(
  p: PriceSource,
  overrides: Record<string, number> = {},
  now = new Date(),
  sectionDiscountPercent: number | null = null
): EffectivePrice {
  const promo = isPromoActive(p, now);
  const base = overrides[p.id] ?? p.priceCents;
  // Exceção individual vence o desconto da seção. Descontos percentuais nunca acumulam.
  const percent = p.individualDiscountPercent ?? sectionDiscountPercent;
  const percentPrice = percent != null && percent > 0
    ? Math.round((base * (100 - Math.min(100, Math.max(0, percent)))) / 100)
    : base;
  // Promoção por preço fixo compete com o percentual: aplica-se somente o menor preço.
  const price = promo ? Math.min(p.promoPriceCents!, percentPrice) : percentPrice;
  const reference = price < base
    ? Math.max(base, p.compareAtPriceCents ?? 0)
    : (p.compareAtPriceCents ?? 0);
  return {
    priceCents: price,
    listPriceCents: reference > price ? reference : null,
    promoActive: promo,
    promoLabel: promo ? (p.promoLabel ?? null) : null,
    promoEndsAt: promo ? toDate(p.promoEndsAt)!.toISOString() : null,
  };
}

export type PricedLine = { productId: string | null; unitPriceCents: number; quantity: number };

export type CouponRule = {
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotalCents: number | null;
  productIds: string[];
};

/** Desconto do cupom — aplicado apenas às linhas elegíveis e nunca maior que elas. */
export function couponDiscount(lines: PricedLine[], coupon: CouponRule | null): number {
  if (!coupon) return 0;
  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  if (coupon.minSubtotalCents && subtotal < coupon.minSubtotalCents) return 0;
  const eligible = lines
    .filter((l) => !coupon.productIds.length || (l.productId && coupon.productIds.includes(l.productId)))
    .reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  if (eligible <= 0) return 0;
  const raw = coupon.type === "PERCENT" ? Math.floor((eligible * Math.min(100, Math.max(0, coupon.value))) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, eligible));
}

export function computeTotals(lines: PricedLine[], shippingCents: number, discountCents = 0) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const discount = Math.min(discountCents, subtotalCents);
  const totalCents = Math.max(0, subtotalCents - discount + shippingCents);
  return { subtotalCents, discountCents: discount, shippingCents, totalCents };
}

/** Número do pedido exibido ao cliente: HB27684-2026 (código aleatório de 5 dígitos + ano). */
export function formatOrderNumber(year: number, code: number) {
  return `HB${code}-${year}`;
}

/** BravoPay: valor mínimo de uma cobrança PIX. */
export const MIN_PIX_CENTS = 500;
