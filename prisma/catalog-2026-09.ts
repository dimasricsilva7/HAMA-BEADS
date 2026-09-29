/**
 * Catálogo definitivo (29/09/2026) — dados enviados pelo lojista com base no anúncio
 * "Kit Perler Hama Beads 2.6mm 24/48/72/96 Cores" da Shopee.
 * Idempotente: pode rodar várias vezes; reaproveita os kits existentes (mesmos IDs).
 *   DATABASE_URL=... npx tsx prisma/catalog-2026-09.ts
 *
 * PENDENTE DE CONFIRMAÇÃO (não publicado): dimensões dos pegboards. O briefing citou
 * "50x50cm", "90x90cm" e "1,20x70cm", medidas incompatíveis com peças de 2,6 mm —
 * provavelmente número de pinos. Preencher em Produtos → Especificações quando confirmado.
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

type Comp = { type: string; label: string; quantity?: string; detail?: string };
const comps = (list: Comp[]) => list.map((c, i) => ({ id: `c${i + 1}`, quantity: null, detail: null, imageUrl: null, isBonus: false, ...c }));

/** Itens que acompanham TODOS os kits (a diferença é só cores/peças). */
const TOOLKIT: Comp[] = [
  { type: "tool", label: "Mini ferro de passar", quantity: "1" },
  { type: "pegboard", label: "Pegboard quadrado", quantity: "1" },
  { type: "tweezers", label: "Pinças de alta precisão", quantity: "2" },
  { type: "digital", label: "100 modelos digitais para se inspirar" },
  { type: "accessory", label: "Pá grande para contas", quantity: "1" },
  { type: "accessory", label: "Pá pequena para contas", quantity: "1" },
  { type: "accessory", label: "Colher para contas", quantity: "1" },
  { type: "accessory", label: "Canaleta seletora de contas", quantity: "1" },
  { type: "accessory", label: "Bandeja para contas", quantity: "1" },
  { type: "accessory", label: "Caixas de armazenamento transparentes", quantity: "2" },
  { type: "accessory", label: "Papel manteiga" },
  { type: "accessory", label: "Cordões para pingente", quantity: "5" },
  { type: "accessory", label: "Argolas para chaveiro", quantity: "5" },
  { type: "accessory", label: "Conectores de chaveiro", quantity: "5" },
  { type: "accessory", label: "Argolas metálicas pequenas", quantity: "5" },
];

const nf = new Intl.NumberFormat("pt-BR");
const KITS = [
  { oldSlug: "kit-inicial", slug: "kit-24-cores", sku: "HB-KIT-24C", name: "Kit Inicial 24 Cores", colors: 24, beads: 16400, price: 3999, order: 1, featured: false, badge: null as string | null },
  { oldSlug: "kit-criador", slug: "kit-48-cores", sku: "HB-KIT-48C", name: "Kit Criador 48 Cores", colors: 48, beads: 30800, price: 6098, order: 2, featured: false, badge: null },
  { oldSlug: "kit-profissional", slug: "kit-72-cores", sku: "HB-KIT-72C", name: "Kit Profissional 72 Cores", colors: 72, beads: 45200, price: 9890, order: 3, featured: false, badge: null },
  { oldSlug: null, slug: "kit-96-cores", sku: "HB-KIT-96C", name: "Kit Mestre 96 Cores", colors: 96, beads: 59600, price: 11990, order: 4, featured: true, badge: "Mais completo" },
];

async function upsertProduct(oldSlug: string | null, data: Prisma.ProductCreateInput & { slug: string }) {
  const existing = (await db.product.findUnique({ where: { slug: data.slug } })) ?? (oldSlug ? await db.product.findUnique({ where: { slug: oldSlug } }) : null);
  if (existing) {
    if (existing.priceCents !== data.priceCents) {
      await db.priceHistory.create({ data: { productId: existing.id, oldPriceCents: existing.priceCents, newPriceCents: data.priceCents } });
    }
    return db.product.update({ where: { id: existing.id }, data });
  }
  const created = await db.product.create({ data });
  await db.priceHistory.create({ data: { productId: created.id, oldPriceCents: null, newPriceCents: created.priceCents } });
  return created;
}

async function main() {
  // ───────────── Complementos ─────────────
  const pegQ = await upsertProduct("pegboard-grande", {
    slug: "pegboard-quadrado-grande",
    sku: "HB-PEG-QG",
    name: "Pegboard quadrado grande",
    category: "PEGBOARD",
    fulfillment: "PHYSICAL",
    priceCents: 1999,
    active: true,
    pegboardCount: 1,
    shortDescription: "Base quadrada maior para criações grandes — ou para montar duas ao mesmo tempo.",
    components: comps([{ type: "pegboard", label: "Pegboard quadrado grande", quantity: "1" }]),
    sortOrder: 10,
  });
  const pegR = await upsertProduct(null, {
    slug: "pegboard-retangular-grande",
    sku: "HB-PEG-RG",
    name: "Pegboard retangular grande",
    category: "PEGBOARD",
    fulfillment: "PHYSICAL",
    priceCents: 3498,
    active: true,
    pegboardCount: 1,
    shortDescription: "Base retangular grande para painéis, quadros e projetos de Pixel Art maiores.",
    components: comps([{ type: "pegboard", label: "Pegboard retangular grande", quantity: "1" }]),
    sortOrder: 11,
  });
  const refil = await upsertProduct(null, {
    slug: "refil-24-cores-1000-pecas",
    sku: "HB-REF-24C-1K",
    name: "Refil 1.000 peças · 24 cores",
    category: "BEADS",
    fulfillment: "PHYSICAL",
    priceCents: 1490,
    active: true,
    beadCount: 1000,
    colorCount: 24,
    shortDescription: "Somente as miçangas: 1.000 peças em 24 cores, com caixa.",
    description: "Refil de peças para continuar criando: 1.000 miçangas em 24 cores, acompanhadas de caixa. Não inclui ferramentas.",
    components: comps([
      { type: "beads", label: "1.000 peças em 24 cores" },
      { type: "accessory", label: "Caixa", quantity: "1" },
    ]),
    sortOrder: 12,
  });
  const library = await db.product.findUnique({ where: { slug: "biblioteca-500-modelos" } });
  const papel = await db.product.findUnique({ where: { slug: "papel-manteiga" } });

  // Produtos antigos que não fazem parte da oferta real ficam inativos
  await db.product.updateMany({
    where: { slug: { in: ["pegboard-tradicional", "kit-2-pegboards", "pinca", "kit-pincas", "modelos-20", "modelos-50", "modelos-100", "papel-manteiga", "fita-dupla-face"] } },
    data: { active: false },
  });

  const cross = [pegQ.id, pegR.id, refil.id, ...(library ? [library.id] : [])];

  // ───────────── Kits ─────────────
  const kitIds: string[] = [];
  for (const k of KITS) {
    const beads = nf.format(k.beads);
    const kit = await upsertProduct(k.oldSlug, {
      slug: k.slug,
      sku: k.sku,
      name: k.name,
      category: "KIT",
      fulfillment: "HYBRID",
      priceCents: k.price,
      compareAtPriceCents: null,
      active: true,
      featured: k.featured,
      badge: k.badge,
      beadCount: k.beads,
      colorCount: k.colors,
      pegboardCount: 1,
      modelCount: 100,
      shortDescription: `${beads} peças em ${k.colors} cores + mini ferro, pegboard, 2 pinças de precisão, ferramentas de organização, acessórios para chaveiro e 100 modelos digitais.`,
      description: `Tudo para criar Pixel Art em casa: ${beads} peças Hama Beads em ${k.colors} cores, mini ferro de passar, pegboard quadrado, 2 pinças de alta precisão, pá grande e pá pequena, colher, canaleta seletora, bandeja, 2 caixas de armazenamento transparentes e papel manteiga.\n\nPara transformar as criações em chaveiros e pingentes, o kit traz 5 cordões para pingente, 5 argolas para chaveiro, 5 conectores de chaveiro e 5 argolas metálicas pequenas. E você ainda começa com 100 modelos digitais para se inspirar.`,
      components: comps([{ type: "beads", label: `${beads} peças em ${k.colors} cores` }, ...TOOLKIT]) as unknown as Prisma.InputJsonValue,
      specs: [
        { label: "Cores", value: String(k.colors) },
        { label: "Peças", value: beads },
        { label: "Tamanho das peças", value: "2,6 mm (mini)" },
      ],
      crossSellIds: cross,
      includedProductIds: papel ? [papel.id] : [],
      sortOrder: k.order,
      seoTitle: `${k.name} — ${beads} peças Hama Beads`,
      seoDescription: `Kit Hama Beads com ${beads} peças em ${k.colors} cores, mini ferro, pegboard, 2 pinças, acessórios para chaveiro e 100 modelos digitais.`,
    });
    kitIds.push(kit.id);
  }
  const kit96 = await db.product.findUniqueOrThrow({ where: { slug: "kit-96-cores" } });

  // ───────────── Order bumps (substitui os antigos) ─────────────
  await db.orderBump.deleteMany({});
  await db.orderBump.createMany({
    data: [
      { name: "Refil 1.000 peças", productId: refil.id, title: "Adicione +1.000 peças em 24 cores (com caixa)", description: "Mais miçangas para não faltar cor no meio do projeto.", sortOrder: 1, active: true, triggerProductIds: kitIds },
      { name: "Pegboard quadrado grande", productId: pegQ.id, title: "Adicione um pegboard quadrado grande", description: "Para criações maiores ou para montar duas ao mesmo tempo.", sortOrder: 2, active: true, triggerProductIds: kitIds },
      ...(library ? [{ name: "Biblioteca 500+", productId: library.id, title: "Adicione a biblioteca 500+ modelos", description: "Mais de 500 modelos organizados por categorias, liberados na página do pedido.", sortOrder: 3, active: true, triggerProductIds: kitIds }] : []),
    ],
  });

  // ───────────── Upsells pós-compra (sequência) ─────────────
  await db.upsell.deleteMany({});
  await db.upsell.createMany({
    data: [
      { name: "Pegboard retangular grande", productId: pegR.id, headline: "Já que você garantiu seu kit…", title: "Leve também o pegboard retangular grande", description: "Base maior para painéis e quadros de Pixel Art.", sortOrder: 1, active: true },
      { name: "Pegboard quadrado grande", productId: pegQ.id, headline: "Para criar ainda maior", title: "Adicione o pegboard quadrado grande", description: "Monte criações maiores ou duas ao mesmo tempo.", sortOrder: 2, active: true },
      { name: "Refil 1.000 peças", productId: refil.id, headline: "Para não faltar cor", title: "Leve +1.000 peças em 24 cores (com caixa)", sortOrder: 3, active: true },
      ...(library ? [{ name: "Biblioteca 500+", productId: library.id, headline: "Sua biblioteca de ideias", title: "Adicione 500+ modelos à sua biblioteca", description: "Acesso liberado na página do pedido logo após o pagamento.", sortOrder: 4, active: true }] : []),
    ],
  });

  // ───────────── Landing page ─────────────
  const section = async (key: string, data: Prisma.LandingSectionUpdateInput, cfg?: Record<string, unknown>) => {
    const s = await db.landingSection.findUnique({ where: { key } });
    if (!s) return;
    const config = cfg ? ({ ...(s.config as object), ...cfg } as Prisma.InputJsonValue) : undefined;
    await db.landingSection.update({ where: { key }, data: { ...data, ...(config ? { config } : {}) } });
  };
  await section(
    "hero",
    { subtitle: "Kit completo para criar Pixel Art em casa: milhares de peças, mini ferro, pegboard, pinças, acessórios para chaveiros e 100 modelos para começar." },
    {
      stats: [
        { value: "até 96", label: "cores" },
        { value: "até 59.600", label: "peças" },
        { value: "Mini ferro", label: "+ pegboard e 2 pinças" },
      ],
    }
  );
  await section("kits", { title: "Escolha seu kit", subtitle: "Todos vêm com o mesmo kit de ferramentas e acessórios. O que muda é a quantidade de cores e de peças." });
  await section("offer", { title: "Tudo para começar", subtitle: "Tudo o que vem no Kit Mestre 96 Cores. Os outros kits trazem os mesmos itens, com menos cores e peças.", ctaLabel: "QUERO O KIT DE 96 CORES" }, { productId: kit96.id });
  await section("benefits", {}, {
    items: [
      { icon: "palette", title: "Criatividade sem limite", text: "De personagens a decorações: você decide o que criar." },
      { icon: "hand", title: "Atividade manual", text: "Uma pausa das telas com foco, calma e mãos à obra." },
      { icon: "home", title: "Diversão em família", text: "Dá para montar junto, dividir tarefas e trocar ideias." },
      { icon: "gift", title: "Vira chaveiro e pingente", text: "Os kits já trazem argolas, conectores e cordões." },
    ],
  });
  const how = await db.landingSection.findUnique({ where: { key: "how_it_works" } });
  if (how) {
    const steps = ((how.config as { steps?: { title: string; text: string }[] }).steps ?? []).map((s, i) =>
      i === 3 ? { title: "Faça a finalização", text: "Cubra com o papel manteiga e passe o mini ferro, seguindo as instruções." } : s
    );
    await section("how_it_works", {}, { steps });
  }
  await section("complete_kit", { title: "Complete seu kit", subtitle: "Pegboards maiores e refil de peças para criar ainda mais." });
  await section("final_cta", { subtitle: "Escolha entre 24, 48, 72 ou 96 cores e comece hoje." });

  // ───────────── FAQ ─────────────
  const faq = async (question: string, answer: string, active = true) => {
    const f = await db.faq.findFirst({ where: { question } });
    if (f) await db.faq.update({ where: { id: f.id }, data: { answer, active } });
    else await db.faq.create({ data: { question, answer, active, sortOrder: (await db.faq.count()) + 1 } });
  };
  await faq("Qual a diferença entre os kits?", "Todos os kits trazem o mesmo conjunto de ferramentas e acessórios: mini ferro, pegboard, 2 pinças de precisão, pás, colher, canaleta seletora, bandeja, 2 caixas organizadoras, papel manteiga, acessórios para chaveiro e 100 modelos digitais. A diferença está na quantidade de cores e de peças. Compare na seção [Escolha seu kit](#kits).");
  await faq("Qual o tamanho das peças?", "As peças são do tipo mini, com 2,6 mm.");
  await faq("Quantas cores vêm?", "Depende do kit: 24, 48, 72 ou 96 cores. Veja a comparação na seção [Escolha seu kit](#kits).");
  await faq("O ferro acompanha?", "Sim. Todos os kits vêm com um mini ferro de passar. Use sempre conforme as instruções e mantenha longe de crianças sem a supervisão de um adulto.");
  await faq("O papel manteiga acompanha?", "Sim, todos os kits incluem papel manteiga para a finalização.");
  await faq("Posso comprar pegboards separados?", "Sim. O pegboard quadrado grande e o pegboard retangular grande podem ser comprados separadamente ou junto com o seu kit, em [Complete seu kit](#complementos).");
  await faq("Posso comprar mais peças?", "Sim. O refil com 1.000 peças em 24 cores, com caixa, pode ser adicionado ao pedido.");
  await faq("Dá para fazer chaveiros e pingentes?", "Sim. Todos os kits trazem 5 cordões para pingente, 5 argolas para chaveiro, 5 conectores de chaveiro e 5 argolas metálicas pequenas.");

  console.log("Catálogo atualizado:", KITS.map((k) => `${k.name} R$ ${(k.price / 100).toFixed(2)}`).join(" · "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
