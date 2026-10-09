/**
 * Definições de domínio compartilhadas (cliente + servidor). Nada aqui contém
 * preço, composição ou dado comercial — isso vive no banco e é editado no admin.
 */

// ───────────── Catálogo ─────────────

export const CATEGORY_LABEL = {
  KIT: "Kit",
  BEADS: "Peças (refil)",
  PEGBOARD: "Pegboard",
  TWEEZERS: "Pinças",
  DIGITAL_MODELS: "Modelos digitais",
  ACCESSORY: "Acessório",
  TOOL: "Ferramenta",
  OTHER: "Outros",
} as const;

export const FULFILLMENT_LABEL = { PHYSICAL: "Físico", DIGITAL: "Digital", HYBRID: "Físico + digital" } as const;
export const STOCK_LABEL = { IN_STOCK: "Disponível", OUT_OF_STOCK: "Esgotado", PREORDER: "Pré-venda" } as const;

export const COMPONENT_TYPES = ["beads", "pegboard", "tweezers", "tool", "accessory", "digital", "bonus"] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];
export const COMPONENT_LABEL: Record<ComponentType, string> = {
  beads: "Peças",
  pegboard: "Pegboard",
  tweezers: "Pinça",
  tool: "Ferramenta",
  accessory: "Acessório",
  digital: "Digital",
  bonus: "Bônus",
};

/** Item da composição de um produto (editável no admin). */
export type ProductComponent = {
  id: string;
  type: ComponentType;
  label: string;
  quantity?: string | null;
  detail?: string | null;
  imageUrl?: string | null;
  isBonus?: boolean;
};

export type ProductSpec = { label: string; value: string };
export type GalleryImage = { url: string; alt?: string };

// ───────────── Pedidos ─────────────

export const ORDER_STATUS_LABEL = {
  PENDING: "Aguardando PIX",
  PIX_GENERATED: "PIX gerado",
  PAID: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  EXPIRED: "PIX expirado",
  REFUNDED: "Reembolsado",
  CHARGEBACK: "Contestação",
  FAILED: "Falhou",
  CREDIARIO_PENDENTE: "Crediário pendente",
  CREDIARIO_EM_ANALISE: "Crediário em análise",
  CREDIARIO_APROVADO: "Crediário aprovado",
  CREDIARIO_RECUSADO: "Crediário recusado",
  CREDIARIO_CANCELADO: "Crediário cancelado",
} as const;
export type OrderStatusKey = keyof typeof ORDER_STATUS_LABEL;

export const PAYMENT_METHOD_LABEL = { PIX: "PIX", CREDIARIO: "Crediário" } as const;

/** Status em que o pagamento já foi confirmado (receita). Crediário aprovado conta como pago. */
export const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CREDIARIO_APROVADO"] as const;
export const AWAITING_STATUSES = ["PENDING", "PIX_GENERATED"] as const;
export const isPaidStatus = (s: string) => (PAID_STATUSES as readonly string[]).includes(s);
export const isAwaitingStatus = (s: string) => (AWAITING_STATUSES as readonly string[]).includes(s);

/** Crediário: estados próprios (análise manual do protocolo pelo admin). */
export const CREDIARIO_STATUSES = ["CREDIARIO_PENDENTE", "CREDIARIO_EM_ANALISE", "CREDIARIO_APROVADO", "CREDIARIO_RECUSADO", "CREDIARIO_CANCELADO"] as const;
export type CrediarioStatus = (typeof CREDIARIO_STATUSES)[number];
export const isCrediarioStatus = (s: string) => (CREDIARIO_STATUSES as readonly string[]).includes(s);
export const isCrediarioPending = (s: string) => s === "CREDIARIO_PENDENTE" || s === "CREDIARIO_EM_ANALISE";

/** Transições permitidas do crediário. Aprovado segue para a entrega pelo fluxo normal. */
export const CREDIARIO_TRANSITIONS: Record<CrediarioStatus, CrediarioStatus[]> = {
  CREDIARIO_PENDENTE: ["CREDIARIO_EM_ANALISE", "CREDIARIO_APROVADO", "CREDIARIO_RECUSADO", "CREDIARIO_CANCELADO"],
  CREDIARIO_EM_ANALISE: ["CREDIARIO_APROVADO", "CREDIARIO_RECUSADO", "CREDIARIO_CANCELADO", "CREDIARIO_PENDENTE"],
  CREDIARIO_APROVADO: ["CREDIARIO_CANCELADO"],
  CREDIARIO_RECUSADO: ["CREDIARIO_EM_ANALISE"],
  CREDIARIO_CANCELADO: [],
};

// ───────────── Galeria ─────────────

export const GALLERY_CATEGORIES = ["Pixel Art", "Games", "Animais", "Kawaii", "Comidas", "Objetos", "Personagens", "Diversos"] as const;

// ───────────── Analytics ─────────────

export const TRACKED_EVENTS = [
  "page_view",
  "landing_view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_90",
  "video_start",
  "video_25",
  "video_50",
  "video_75",
  "video_complete",
  "gallery_open",
  "gallery_interaction",
  "inspiration_open",
  "faq_open",
  "product_view",
  "kit_selected",
  "cta_click",
  "add_to_cart",
  "remove_from_cart",
  "cart_view",
  "checkout_started",
  "coupon_applied",
  "order_bump_view",
  "order_bump_accept",
  "order_bump_reject",
  "cross_sell_view",
  "cross_sell_add",
  "upsell_view",
  "upsell_accept",
  "upsell_reject",
  "pix_generated",
  "pix_copy",
  "pix_renewed",
  "checkout_recovered",
  "crediario_started",
  "crediario_data_completed",
  "crediario_order_created",
  "crediario_pending",
  "crediario_in_review",
  "crediario_approved",
  "crediario_rejected",
  "crediario_cancelled",
  "pix_error",
  "payment_pending",
  "payment_paid",
  "purchase",
  "checkout_abandoned",
  "digital_download",
  "email_confirmation_sent",
  "email_recovery_sent",
  "email_shipping_sent",
  "cookie_consent",
] as const;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

/** Etapas do funil exibidas no admin (cada etapa = sessões com pelo menos um dos eventos). */
export const FUNNEL_STEPS: { key: string; label: string; events: TrackedEvent[] }[] = [
  { key: "visitors", label: "Visitantes", events: ["page_view", "landing_view"] },
  { key: "offer", label: "Visualizaram oferta", events: ["scroll_50", "product_view", "kit_selected"] },
  { key: "interact", label: "Interagiram com produto", events: ["product_view", "gallery_interaction", "gallery_open", "inspiration_open", "video_start", "kit_selected"] },
  { key: "kit", label: "Selecionaram kit", events: ["kit_selected"] },
  { key: "cart", label: "Add to cart", events: ["add_to_cart"] },
  { key: "checkout", label: "Checkout", events: ["checkout_started"] },
  { key: "pix", label: "PIX gerado", events: ["pix_generated"] },
  { key: "pix_copy", label: "PIX copiado", events: ["pix_copy"] },
  { key: "paid", label: "Pagamento aprovado", events: ["payment_paid"] },
  { key: "purchase", label: "Compra", events: ["purchase"] },
];

// ───────────── Landing page (CMS) ─────────────

export const SECTION_TYPES = {
  hero: "Hero",
  quick_kits: "Atalho de compra (kits)",
  led_board: "Pegboard LED",
  product_in_use: "Produto em uso",
  video: "Vídeo",
  benefits: "Benefícios",
  how_it_works: "Como funciona",
  gallery: "Galeria de criações",
  inspiration: "O que você criaria?",
  audience: "Público",
  kits: "Comparação dos kits",
  offer: "Oferta — Tudo para começar",
  models_included: "100 modelos inclusos",
  complete_kit: "Complete seu kit",
  library: "Biblioteca de modelos",
  reviews: "Avaliações",
  faq: "FAQ",
  trust: "Segurança da compra",
  final_cta: "CTA final",
} as const;
export type SectionType = keyof typeof SECTION_TYPES;

export type IconItem = { icon?: string; title: string; text?: string };

/** Ícones pixel disponíveis para benefícios, passos e selos. */
export const PIXEL_ICONS = ["heart", "star", "sparkle", "palette", "grid", "hand", "gift", "home", "clock", "shield", "pix", "chat", "truck", "download", "iron", "check", "smile", "puzzle"] as const;
