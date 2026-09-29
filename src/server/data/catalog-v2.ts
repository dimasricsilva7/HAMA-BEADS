/**
 * Catálogo v2 (outubro/2026): Pegboard LED com app (oferta com modal no checkout),
 * tecido térmico antiaderente como bônus em todos os kits, compra mais rápida na
 * landing (atalho de kits, mais CTAs) e seção de demonstração do Pegboard LED.
 *
 * Idempotente e conservador: acrescenta o que falta, sem apagar edições do admin.
 * Executado por /api/cron/catalog-v2 (produção) ou `npx tsx scripts/catalog-v2.ts`.
 *
 * Dados do Pegboard LED: título do anúncio de referência na Shopee ("LED Perler Beads
 * Board — placas inteligentes controladas por aplicativo, resistentes ao calor") e
 * descrição do lojista. Preço R$ 98,59; oferta no checkout por R$ 39,43.
 */
import type { Prisma, PrismaClient } from "@prisma/client";

type Comp = { id: string; type: string; label: string; quantity: string | null; detail: string | null; imageUrl: string | null; isBonus: boolean };
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const TECIDO = "Tecido térmico antiaderente reutilizável";

export async function applyCatalogV2(db: PrismaClient) {
  const log: string[] = [];

  // ───────────── Bônus: tecido térmico em todos os kits ─────────────
  const kits = await db.product.findMany({ where: { category: "KIT" } });
  for (const k of kits) {
    const comps = arr<Comp>(k.components);
    if (!comps.some((c) => c.label.toLowerCase().includes("tecido térmico"))) {
      comps.push({ id: `c${Date.now().toString(36)}${comps.length}`, type: "bonus", label: TECIDO, quantity: "1", detail: "Resistente ao calor, protege as peças na finalização", imageUrl: null, isBonus: true });
      const description = k.description && !k.description.includes("tecido térmico") ? `${k.description}\n\nBônus: ${TECIDO.toLowerCase()} para usar com o mini ferro na finalização.` : k.description;
      await db.product.update({ where: { id: k.id }, data: { components: comps as unknown as Prisma.InputJsonValue, description } });
      log.push(`tecido térmico → ${k.name}`);
    }
  }
  await db.product.updateMany({ where: { slug: "kit-96-cores", badge: "Mais completo" }, data: { badge: "Recomendado" } });

  // ───────────── Pegboard LED com app ─────────────
  const ledData = {
    name: "Pegboard LED Inteligente com App",
    category: "PEGBOARD" as const,
    fulfillment: "PHYSICAL" as const,
    shortDescription: "O desenho aparece iluminado na placa pelo app — é só encaixar as peças por cima.",
    description:
      "Placa de LED controlada por aplicativo: você escolhe o desenho no celular e ele aparece iluminado no pegboard, guiando a montagem peça por peça. Fica muito mais fácil criar Pixel Art, especialmente para quem está começando e para as crianças.\n\nResistente ao calor.",
    pegboardCount: 1,
    components: [
      { id: "c1", type: "pegboard", label: "Pegboard LED inteligente", quantity: "1", detail: "Desenho iluminado pelo app", imageUrl: null, isBonus: false },
    ] as unknown as Prisma.InputJsonValue,
    specs: [{ label: "Controle", value: "Aplicativo no celular" }, { label: "Resistência", value: "Resistente ao calor" }] as unknown as Prisma.InputJsonValue,
  };
  let led = await db.product.findUnique({ where: { slug: "pegboard-led-app" } });
  if (!led) {
    led = await db.product.create({ data: { slug: "pegboard-led-app", sku: "HB-PEG-LED", priceCents: 9859, active: true, sortOrder: 9, ...ledData } });
    await db.priceHistory.create({ data: { productId: led.id, oldPriceCents: null, newPriceCents: 9859 } });
    log.push("produto Pegboard LED criado");
  }

  const kitIds = kits.map((k) => k.id);
  // O LED é vendido pela oferta do checkout (preço especial), não pelo cross-sell a preço cheio
  for (const k of kits) {
    const cross = arr<string>(k.crossSellIds);
    if (cross.includes(led.id)) await db.product.update({ where: { id: k.id }, data: { crossSellIds: cross.filter((id) => id !== led.id) } });
  }

  // Order bump em destaque (modal antes de gerar o PIX)
  if (!(await db.orderBump.findFirst({ where: { productId: led.id } }))) {
    await db.orderBump.updateMany({ data: { sortOrder: { increment: 1 } } });
    await db.orderBump.create({
      data: {
        name: "Pegboard LED — oferta do checkout",
        productId: led.id,
        title: "Pegboard LED com app por R$ 39,43",
        description: "O desenho aparece iluminado na placa pelo aplicativo — é só encaixar as peças por cima.",
        benefit: "60% de desconto só neste pedido",
        priceCents: 3943,
        sortOrder: 0,
        active: true,
        triggerProductIds: kitIds,
        showModal: true,
        modalTitle: "Espere! Leve o Pegboard LED com 60% de desconto",
      },
    });
    log.push("order bump LED (modal) criado");
  }

  // Upsell pós-compra: LED primeiro na sequência (só aparece se não comprou no checkout)
  if (!(await db.upsell.findFirst({ where: { productId: led.id } }))) {
    await db.upsell.updateMany({ data: { sortOrder: { increment: 1 } } });
    await db.upsell.create({
      data: {
        name: "Pegboard LED",
        productId: led.id,
        headline: "Última chance desta oferta",
        title: "Pegboard LED com app com 60% de desconto",
        description: "O desenho aparece iluminado na placa pelo app — muito mais fácil de montar.",
        priceCents: 3943,
        sortOrder: 0,
        active: true,
      },
    });
    log.push("upsell LED criado");
  }

  // ───────────── Landing page ─────────────
  const sections = await db.landingSection.findMany({ orderBy: { sortOrder: "asc" } });
  const insertAfter = async (afterKey: string, data: Prisma.LandingSectionCreateInput) => {
    if (sections.some((s) => s.key === data.key)) return;
    const after = sections.find((s) => s.key === afterKey);
    const pos = (after?.sortOrder ?? sections.length) + 1;
    await db.landingSection.updateMany({ where: { sortOrder: { gte: pos } }, data: { sortOrder: { increment: 1 } } });
    await db.landingSection.create({ data: { ...data, sortOrder: pos } });
    sections.forEach((s) => (s.sortOrder >= pos ? (s.sortOrder += 1) : null));
    sections.push({ key: data.key, sortOrder: pos } as (typeof sections)[number]);
    log.push(`seção ${data.key} criada`);
  };
  await insertAfter("hero", { key: "quick_kits", type: "quick_kits", label: "Atalho de compra (kits)", title: "Escolha seu kit", subtitle: "Toque no kit para comprar. Todos vêm com mini ferro, pegboard, pinças e bônus.", config: {} });
  await insertAfter("how_it_works", {
    key: "led_board",
    type: "led_board",
    label: "Pegboard LED",
    title: "Pegboard LED com app: o desenho aparece na placa",
    subtitle: "Escolha o desenho no celular e ele aparece iluminado na placa. É só encaixar as peças por cima.",
    ctaLabel: "ESCOLHER MEU KIT E GARANTIR O LED",
    ctaTarget: "#kits",
    config: {
      productId: led.id,
      items: ["O desenho aparece iluminado na placa", "Controle pelo aplicativo no celular", "Mais fácil para iniciantes e crianças", "Resistente ao calor"],
      offerNote: "Oferta exclusiva no checkout: 60% de desconto ao comprar junto com o seu kit.",
    },
  });
  // Mais pontos de compra ao longo da página
  for (const key of ["benefits", "how_it_works", "gallery", "audience_adults", "models_included"]) {
    await db.landingSection.updateMany({ where: { key, ctaLabel: null }, data: { ctaLabel: "Ver kits e preços", ctaTarget: "#kits" } });
  }
  const hero = sections.find((s) => s.key === "hero");
  if (hero) {
    const cfg = (hero.config ?? {}) as Record<string, unknown>;
    const stats = arr<{ value: string; label: string }>(cfg.stats);
    if (!stats.some((s) => s.label.includes("tecido"))) {
      const next = [...stats.slice(0, 2), { value: "Bônus", label: "tecido térmico reutilizável" }];
      await db.landingSection.update({ where: { key: "hero" }, data: { config: { ...cfg, stats: next } as Prisma.InputJsonValue } });
    }
  }

  // ───────────── FAQ ─────────────
  const faq = async (question: string, answer: string) => {
    const f = await db.faq.findFirst({ where: { question } });
    if (f) await db.faq.update({ where: { id: f.id }, data: { answer, active: true } });
    else await db.faq.create({ data: { question, answer, active: true, sortOrder: (await db.faq.count()) + 1 } });
  };
  await faq("O papel manteiga acompanha?", "Sim. Todos os kits incluem papel manteiga e, de bônus, um tecido térmico antiaderente reutilizável para a finalização com o mini ferro.");
  await faq("O que é o tecido térmico?", "É um pano antiaderente, reutilizável e resistente ao calor. Você coloca entre o mini ferro e as peças na hora da finalização. Acompanha todos os kits como bônus.");
  await faq("O que é o Pegboard LED?", "É um pegboard com LEDs controlado por aplicativo: você escolhe o desenho no celular e ele aparece iluminado na placa, mostrando onde encaixar as peças. Ele é vendido à parte e aparece como oferta especial no checkout.");

  return { ok: true, log };
}
