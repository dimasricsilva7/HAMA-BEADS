import type { EmailOrder } from "./templates";

/** Dados de exemplo para visualizar os templates antes do primeiro pedido. */
export const SAMPLE_ORDER: EmailOrder = {
  orderNumber: "HB27684-2026",
  firstName: "Maria",
  items: [
    { name: "Kit Mestre 96 Cores", quantity: 1, totalCents: 11990, kind: "PRODUCT" },
    { name: "Pegboard LED Inteligente com App", quantity: 1, totalCents: 3943, kind: "ORDER_BUMP" },
  ],
  subtotalCents: 15933,
  discountCents: 0,
  shippingCents: 0,
  totalCents: 15933,
  hasDigital: true,
  requiresShipping: true,
  pixCopyPaste: "00020126580014BR.GOV.BCB.PIX0136exemplo-de-codigo-pix-copia-e-cola5204000053039865406159.335802BR6009SAO PAULO",
  pixExpiresAt: new Date(Date.now() + 20 * 60_000),
  trackingCode: "AA123456789BR",
  address: "Rua Exemplo, 100 · Centro · São Paulo/SP · 01000-000",
};
