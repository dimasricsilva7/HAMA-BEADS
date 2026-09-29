/**
 * Seed inicial idempotente: cria o que não existe e NUNCA sobrescreve edições do admin.
 *
 * Regra do projeto: nada comercial é inventado.
 * - Preços: apenas os valores iniciais sugeridos no briefing (kits e 500+ modelos).
 * - Complementos sem preço definido nascem INATIVOS (preço 0) até o admin configurar.
 * - Quantidade de cores, tamanho das peças e dimensões dos pegboards ficam vazios.
 * - FAQs que dependem de dado não confirmado nascem inativas com [PREENCHER].
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

type Comp = { type: string; label: string; quantity?: string; detail?: string; isBonus?: boolean };
const comps = (list: Comp[]) => list.map((c, i) => ({ id: `c${i + 1}`, quantity: null, detail: null, imageUrl: null, isBonus: false, ...c }));

const KIT_BASE = (beads: string): Comp[] => [
  { type: "beads", label: `${beads} peças Hama Beads` },
  { type: "pegboard", label: "Pegboard", quantity: "1" },
  { type: "tweezers", label: "Pinça", quantity: "1" },
  { type: "tool", label: "Ferro / ferramenta de fusão" },
  { type: "accessory", label: "Acessórios do kit" },
  { type: "digital", label: "100 modelos digitais para começar" },
];

async function main() {
  // ───────────── Produtos ─────────────
  const products: (Prisma.ProductCreateInput & { slug: string })[] = [
    {
      slug: "kit-inicial",
      sku: "HB-KIT-14K",
      name: "Kit Inicial",
      category: "KIT",
      fulfillment: "HYBRID",
      shortDescription: "14.000 peças, pegboard, pinça, ferramenta de fusão e 100 modelos para dar os primeiros passos.",
      description:
        "O jeito mais simples de começar no Hama Beads. O kit traz milhares de peças, a base (pegboard) para montar, pinça para os detalhes, a ferramenta de fusão e 100 modelos digitais para você escolher o primeiro desenho.",
      priceCents: 4990,
      beadCount: 14000,
      pegboardCount: 1,
      modelCount: 100,
      components: comps(KIT_BASE("14.000")),
      sortOrder: 1,
      seoTitle: "Kit Inicial Hama Beads — 14.000 peças",
      seoDescription: "Kit Inicial de Hama Beads com 14.000 peças, pegboard, pinça, ferramenta de fusão e 100 modelos digitais.",
    },
    {
      slug: "kit-criador",
      sku: "HB-KIT-24K",
      name: "Kit Criador",
      category: "KIT",
      fulfillment: "HYBRID",
      shortDescription: "24.000 peças para quem quer criar mais: pegboard, pinça, ferramenta de fusão e 100 modelos.",
      description:
        "Mais peças para projetos maiores e mais criações. Acompanha pegboard, pinça, ferramenta de fusão, acessórios e 100 modelos digitais para começar.",
      priceCents: 7990,
      beadCount: 24000,
      pegboardCount: 1,
      modelCount: 100,
      components: comps(KIT_BASE("24.000")),
      sortOrder: 2,
      seoTitle: "Kit Criador Hama Beads — 24.000 peças",
      seoDescription: "Kit Criador de Hama Beads com 24.000 peças, pegboard, pinça, ferramenta de fusão e 100 modelos digitais.",
    },
    {
      slug: "kit-profissional",
      sku: "HB-KIT-48K",
      name: "Kit Profissional",
      category: "KIT",
      fulfillment: "HYBRID",
      shortDescription: "48.000 peças, pegboard tradicional + pegboard maior, pinças, ferramenta de fusão, 100 modelos e bônus.",
      description:
        "O kit mais completo da loja: 48.000 peças, dois pegboards (tradicional e maior), pinças, ferramenta de fusão, acessórios, 100 modelos digitais e, de bônus, papel manteiga e fita dupla face larga.",
      priceCents: 11990,
      beadCount: 48000,
      pegboardCount: 2,
      modelCount: 100,
      badge: "Mais completo",
      featured: true,
      components: comps([
        { type: "beads", label: "48.000 peças Hama Beads" },
        { type: "pegboard", label: "Pegboard tradicional", quantity: "1" },
        { type: "pegboard", label: "Pegboard maior", quantity: "1" },
        { type: "tweezers", label: "Pinças" },
        { type: "tool", label: "Ferro / ferramenta de fusão" },
        { type: "accessory", label: "Acessórios do kit" },
        { type: "digital", label: "100 modelos digitais para começar" },
        { type: "bonus", label: "Papel manteiga", isBonus: true },
        { type: "bonus", label: "Fita dupla face larga", isBonus: true },
      ]),
      sortOrder: 3,
      seoTitle: "Kit Profissional Hama Beads — 48.000 peças",
      seoDescription: "Kit Profissional de Hama Beads com 48.000 peças, dois pegboards, pinças, ferramenta de fusão, 100 modelos e bônus.",
    },
    // Complementos — inativos até o admin definir preço/conteúdo
    { slug: "pegboard-tradicional", sku: "HB-PEG-STD", name: "Pegboard tradicional", category: "PEGBOARD", priceCents: 0, active: false, pegboardCount: 1, shortDescription: "Base extra para montar mais de uma criação ao mesmo tempo.", sortOrder: 10 },
    { slug: "pegboard-grande", sku: "HB-PEG-LG", name: "Pegboard grande", category: "PEGBOARD", priceCents: 0, active: false, pegboardCount: 1, shortDescription: "Base maior para projetos de Pixel Art maiores.", sortOrder: 11 },
    { slug: "kit-2-pegboards", sku: "HB-PEG-2X", name: "Kit com 2 pegboards", category: "PEGBOARD", priceCents: 0, active: false, pegboardCount: 2, shortDescription: "Duas bases para montar mais projetos em paralelo.", sortOrder: 12 },
    { slug: "pinca", sku: "HB-PIN-1", name: "Pinça", category: "TWEEZERS", priceCents: 0, active: false, shortDescription: "Pinça para posicionar as peças com precisão.", sortOrder: 20 },
    { slug: "kit-pincas", sku: "HB-PIN-KIT", name: "Kit de pinças", category: "TWEEZERS", priceCents: 0, active: false, shortDescription: "Pinças extras para criar a várias mãos.", sortOrder: 21 },
    { slug: "modelos-20", sku: "HB-MOD-20", name: "20 modelos digitais", category: "DIGITAL_MODELS", fulfillment: "DIGITAL", priceCents: 0, active: false, modelCount: 20, shortDescription: "Pacote com 20 modelos para reproduzir no pegboard.", sortOrder: 30 },
    { slug: "modelos-50", sku: "HB-MOD-50", name: "50 modelos digitais", category: "DIGITAL_MODELS", fulfillment: "DIGITAL", priceCents: 0, active: false, modelCount: 50, shortDescription: "Pacote com 50 modelos para reproduzir no pegboard.", sortOrder: 31 },
    { slug: "modelos-100", sku: "HB-MOD-100", name: "100 modelos digitais", category: "DIGITAL_MODELS", fulfillment: "DIGITAL", priceCents: 0, active: false, modelCount: 100, shortDescription: "Pacote com mais 100 modelos para reproduzir no pegboard.", sortOrder: 32 },
    {
      slug: "biblioteca-500-modelos",
      sku: "HB-MOD-500",
      name: "Biblioteca 500+ modelos",
      category: "DIGITAL_MODELS",
      fulfillment: "DIGITAL",
      priceCents: 1990,
      modelCount: 500,
      shortDescription: "Mais de 500 modelos organizados por categorias para nunca faltar ideia.",
      description: "Uma biblioteca digital com mais de 500 modelos de Pixel Art organizados por categorias. O acesso é liberado na página do pedido após a confirmação do pagamento.",
      sortOrder: 33,
    },
    { slug: "papel-manteiga", sku: "HB-ACC-PAPEL", name: "Papel manteiga", category: "ACCESSORY", priceCents: 0, active: false, shortDescription: "Usado no processo de fusão das peças.", sortOrder: 40 },
    { slug: "fita-dupla-face", sku: "HB-ACC-FITA", name: "Fita dupla face larga", category: "ACCESSORY", priceCents: 0, active: false, shortDescription: "Para fixar e expor suas criações.", sortOrder: 41 },
  ];

  const bySlug: Record<string, string> = {};
  for (const p of products) {
    const row = await db.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    bySlug[p.slug] = row.id;
  }

  // Cross-sell inteligente (regras editáveis por produto) — só preenche se ainda vazio
  const rules: Record<string, { cross: string[]; included?: string[] }> = {
    "kit-inicial": { cross: ["pegboard-tradicional", "modelos-50", "biblioteca-500-modelos", "pinca"] },
    "kit-criador": { cross: ["pegboard-grande", "modelos-50", "biblioteca-500-modelos", "kit-pincas"] },
    "kit-profissional": { cross: ["biblioteca-500-modelos", "modelos-100", "kit-pincas"], included: ["papel-manteiga", "fita-dupla-face"] },
  };
  for (const [slug, r] of Object.entries(rules)) {
    const p = await db.product.findUnique({ where: { slug } });
    if (p && Array.isArray(p.crossSellIds) && p.crossSellIds.length === 0) {
      await db.product.update({
        where: { slug },
        data: { crossSellIds: r.cross.map((s) => bySlug[s]), includedProductIds: (r.included ?? []).map((s) => bySlug[s]) },
      });
    }
  }

  // ───────────── Order bumps ─────────────
  if ((await db.orderBump.count()) === 0) {
    const kits = [bySlug["kit-inicial"], bySlug["kit-criador"], bySlug["kit-profissional"]];
    await db.orderBump.createMany({
      data: [
        { name: "Biblioteca 500+", productId: bySlug["biblioteca-500-modelos"], title: "Adicione a biblioteca 500+ modelos", description: "Mais de 500 modelos organizados por categorias, liberados junto com o seu pedido.", benefit: "Ideias para muitos projetos", sortOrder: 1, active: true, triggerProductIds: kits },
        { name: "50 modelos extras", productId: bySlug["modelos-50"], title: "Adicione 50 modelos extras", description: "Mais 50 modelos para reproduzir no pegboard.", sortOrder: 2, active: false, triggerProductIds: kits },
        { name: "Pegboard extra", productId: bySlug["pegboard-tradicional"], title: "Adicione um pegboard extra", description: "Monte mais de uma criação ao mesmo tempo.", sortOrder: 3, active: false, triggerProductIds: kits },
        { name: "Pinça extra", productId: bySlug["pinca"], title: "Adicione uma pinça extra", description: "Para criar a quatro mãos.", sortOrder: 4, active: false, triggerProductIds: kits },
      ],
    });
  }

  // ───────────── Upsells (sequência pós-compra) ─────────────
  if ((await db.upsell.count()) === 0) {
    await db.upsell.createMany({
      data: [
        { name: "Pegboard grande", productId: bySlug["pegboard-grande"], headline: "Já que você garantiu seu kit…", title: "Adicione um Pegboard Grande", description: "Uma base maior para projetos de Pixel Art maiores.", sortOrder: 1, active: false, triggerProductIds: [bySlug["kit-inicial"], bySlug["kit-criador"]] },
        { name: "Mais 100 modelos", productId: bySlug["modelos-100"], headline: "Mais ideias para criar", title: "Leve mais 100 modelos de Hama Beads", sortOrder: 2, active: false },
        { name: "Biblioteca 500+", productId: bySlug["biblioteca-500-modelos"], headline: "Sua biblioteca de ideias", title: "Adicione 500+ modelos à sua biblioteca", description: "Acesso liberado na página do pedido logo após o pagamento.", sortOrder: 3, active: true },
        { name: "Kit de pinças", productId: bySlug["kit-pincas"], headline: "Para criar em família", title: "Adicione um kit extra de pinças", sortOrder: 4, active: false },
        { name: "Acessórios", productId: bySlug["fita-dupla-face"], headline: "Para expor suas criações", title: "Adicione acessórios", sortOrder: 5, active: false },
      ],
    });
  }

  // ───────────── Landing page (CMS) ─────────────
  const sections: Prisma.LandingSectionCreateInput[] = [
    {
      key: "hero",
      type: "hero",
      label: "Hero",
      title: "Transforme pequenas peças em grandes criações.",
      subtitle: "Kit completo para criar Pixel Art em casa, com milhares de peças, ferramentas, pegboards e modelos para começar.",
      ctaLabel: "QUERO MEU KIT",
      ctaTarget: "#kits",
      config: {
        eyebrow: "HAMA BEADS",
        spriteKey: "heart",
        stats: [
          { value: "até 48.000", label: "peças" },
          { value: "100", label: "modelos digitais inclusos" },
          { value: "Pegboard", label: "+ pinça + ferramenta de fusão" },
        ],
        secondaryCtaLabel: "Ver como funciona",
        secondaryCtaTarget: "#como-funciona",
      },
    },
    {
      key: "product_in_use",
      type: "product_in_use",
      label: "Produto em uso",
      title: "Peça por peça, sua ideia ganha forma",
      body: "Você escolhe um desenho, encaixa as peças no pegboard e finaliza seguindo as instruções. Em pouco tempo, o que era uma ideia vira um chaveiro, um ímã, um porta-copos ou uma decoração.",
      config: { spriteKey: "cat", caption: "Substitua por uma foto real do produto em uso" },
    },
    { key: "video", type: "video", label: "Vídeo", title: "Veja o processo do começo ao fim", subtitle: "Da separação das peças à criação pronta.", config: { desktopVideoUrl: "", posterUrl: "" } },
    {
      key: "benefits",
      type: "benefits",
      label: "Benefícios",
      title: "Por que as pessoas se apaixonam por Hama Beads",
      config: {
        items: [
          { icon: "palette", title: "Criatividade sem limite", text: "De personagens a decorações: você decide o que criar." },
          { icon: "hand", title: "Atividade manual", text: "Uma pausa das telas com foco, calma e mãos à obra." },
          { icon: "home", title: "Diversão em família", text: "Dá para montar junto, dividir tarefas e trocar ideias." },
          { icon: "gift", title: "Vira presente", text: "Chaveiros, ímãs e enfeites feitos por você." },
        ],
      },
    },
    {
      key: "how_it_works",
      type: "how_it_works",
      label: "Como funciona",
      title: "Como funciona",
      subtitle: "Seis passos, do desenho à peça pronta.",
      config: {
        steps: [
          { title: "Escolha seu desenho", text: "Use um dos modelos inclusos ou crie o seu." },
          { title: "Separe as peças", text: "Organize as cores que o desenho pede." },
          { title: "Monte no pegboard", text: "Encaixe peça por peça seguindo o modelo." },
          { title: "Faça a finalização", text: "Siga as instruções que acompanham o kit." },
          { title: "Deixe esfriar", text: "Aguarde a peça esfriar antes de retirar." },
          { title: "Sua criação está pronta", text: "Agora é usar, presentear ou expor." },
        ],
        warning: "Siga sempre as instruções de uso. A ferramenta de fusão esquenta: mantenha longe de crianças sem a supervisão de um adulto.",
      },
    },
    { key: "gallery", type: "gallery", label: "Galeria", title: "Galeria de criações", subtitle: "Algumas ideias do que dá para fazer.", config: {} },
    { key: "inspiration", type: "inspiration", label: "O que você criaria?", title: "O que você criaria?", subtitle: "Toque em uma ideia para ver de perto.", ctaLabel: "Quero criar algo assim", ctaTarget: "#kits", config: {} },
    {
      key: "audience_kids",
      type: "audience",
      label: "Para crianças",
      title: "Para crianças",
      subtitle: "Uma atividade criativa para fazer em casa.",
      config: { spriteKey: "bunny", tone: "accent", items: ["Criatividade e imaginação", "Atividade manual longe das telas", "Criações que viram brinquedo e enfeite", "Diversão para fazer em família"] },
    },
    {
      key: "audience_adults",
      type: "audience",
      label: "Para adultos",
      title: "Para adolescentes e adultos",
      subtitle: "Um hobby de Pixel Art que cabe na sua rotina.",
      config: { spriteKey: "gamepad", tone: "primary", items: ["Pixel Art com as próprias mãos", "Hobby para desacelerar", "Personalização de objetos e presentes", "Projetos de decoração"] },
    },
    { key: "kits", type: "kits", label: "Comparação dos kits", title: "Escolha seu kit", subtitle: "Todos acompanham pegboard, pinça, ferramenta de fusão e 100 modelos digitais.", config: {} },
    { key: "offer", type: "offer", label: "Destaque — Tudo para começar", title: "Tudo para começar", subtitle: "Veja tudo o que vem no Kit Profissional.", ctaLabel: "QUERO O KIT PROFISSIONAL", config: { productId: bySlug["kit-profissional"] } },
    {
      key: "models_included",
      type: "models_included",
      label: "100 modelos inclusos",
      title: "Você já começa com 100 modelos",
      body: "Todos os kits incluem acesso a 100 modelos digitais para você não travar no primeiro desenho. É só escolher, separar as cores e montar.",
      config: { deliveryNote: "O acesso aos modelos é liberado na página do seu pedido após a confirmação do pagamento.", sprites: ["star", "cherry", "frog", "rocket", "flower", "gem"] },
    },
    { key: "complete_kit", type: "complete_kit", label: "Complete seu kit", title: "Complete seu kit", subtitle: "Complementos para criar ainda mais.", config: {} },
    {
      key: "library",
      type: "library",
      label: "Biblioteca 500+",
      title: "Quer ainda mais ideias?",
      subtitle: "A biblioteca com 500+ modelos organizados por categorias.",
      ctaLabel: "ADICIONAR AO PEDIDO",
      config: { productId: bySlug["biblioteca-500-modelos"], categories: ["Pixel Art", "Games", "Animais", "Kawaii", "Comidas", "Objetos", "Personagens", "Diversos"] },
    },
    { key: "reviews", type: "reviews", label: "Avaliações", title: "Quem já está criando", config: {} },
    { key: "faq", type: "faq", label: "FAQ", title: "Perguntas frequentes", config: {} },
    {
      key: "trust",
      type: "trust",
      label: "Segurança da compra",
      title: "Compra simples e segura",
      config: {
        items: [
          { icon: "pix", title: "Pagamento via PIX", text: "Processado pela BravoPay. A confirmação é automática." },
          { icon: "shield", title: "Seus dados protegidos", text: "Usados apenas para processar e entregar o seu pedido." },
          { icon: "download", title: "Modelos na página do pedido", text: "O acesso digital é liberado assim que o pagamento é confirmado." },
          { icon: "chat", title: "Atendimento", text: "Fale com a gente pelos canais informados no rodapé." },
        ],
      },
    },
    { key: "final_cta", type: "final_cta", label: "CTA final", title: "Pronto para criar sua primeira peça?", subtitle: "Escolha o kit ideal e comece hoje.", ctaLabel: "ESCOLHER MEU KIT", ctaTarget: "#kits", config: { spriteKey: "star" } },
  ];
  for (const [i, s] of sections.entries()) {
    await db.landingSection.upsert({ where: { key: s.key }, update: {}, create: { ...s, sortOrder: i + 1 } });
  }

  // ───────────── Galeria (placeholders ilustrativos) ─────────────
  if ((await db.galleryItem.count()) === 0) {
    const items: [string, string, string, boolean][] = [
      ["heart", "Coração", "Pixel Art", true],
      ["star", "Estrela", "Pixel Art", true],
      ["gem", "Diamante", "Pixel Art", false],
      ["gamepad", "Controle", "Games", true],
      ["rocket", "Foguete", "Objetos", true],
      ["cat", "Gatinho", "Animais", true],
      ["frog", "Sapinho", "Animais", false],
      ["bunny", "Coelhinho", "Animais", false],
      ["sun", "Solzinho", "Kawaii", true],
      ["cactus", "Cacto", "Kawaii", false],
      ["cherry", "Cerejas", "Comidas", true],
      ["icecream", "Sorvete", "Comidas", false],
      ["donut", "Rosquinha", "Comidas", true],
      ["house", "Casinha", "Objetos", false],
      ["robot", "Robô", "Personagens", false],
      ["flower", "Flor", "Diversos", false],
    ];
    await db.galleryItem.createMany({
      data: items.map(([key, title, category, inspiration], i) => ({
        title,
        category,
        imageUrl: `/placeholders/${key}.svg`,
        alt: `${title} em pixel art (ilustração)`,
        sortOrder: i + 1,
        inspiration,
      })),
    });
  }

  // ───────────── FAQ ─────────────
  if ((await db.faq.count()) === 0) {
    const faqs: [string, string, boolean][] = [
      ["O que são Hama Beads?", "São pequenas peças plásticas que você encaixa em uma base com pinos (o pegboard) para formar desenhos em Pixel Art. Depois de montado, o desenho é finalizado com calor, seguindo as instruções, e as peças ficam unidas formando uma peça única.", true],
      ["Como funciona?", "Você escolhe um desenho, separa as cores, monta no pegboard, faz a finalização seguindo as instruções e deixa esfriar. Pronto: sua criação pode virar chaveiro, ímã, porta-copos ou decoração.", true],
      ["O que acompanha cada kit?", "A composição completa de cada kit aparece na seção [Escolha seu kit](#kits) e na página de cada produto.", true],
      ["Qual a diferença entre os kits?", "A principal diferença é a quantidade de peças e de acessórios. O Kit Profissional é o mais completo: tem mais peças, um pegboard maior além do tradicional e bônus. Compare lado a lado na seção [Escolha seu kit](#kits).", true],
      ["Qual o tamanho das peças?", "[PREENCHER] Informe o diâmetro das peças do kit.", false],
      ["Quantas cores vêm?", "[PREENCHER] Informe a quantidade de cores de cada kit.", false],
      ["O que é pegboard?", "É a base plástica com pinos onde você encaixa as peças para montar o desenho.", true],
      ["Como utilizar o pegboard?", "Posicione as peças nos pinos seguindo o modelo escolhido. Com o desenho completo, faça a finalização conforme as instruções que acompanham o kit.", true],
      ["O ferro acompanha?", "Sim. Todos os kits incluem a ferramenta de fusão listada na composição. Use sempre conforme as instruções e mantenha longe de crianças sem a supervisão de um adulto.", true],
      ["O papel manteiga acompanha?", "O Kit Profissional inclui papel manteiga como bônus. Confira a composição de cada kit na seção [Escolha seu kit](#kits).", true],
      ["O que são os modelos digitais?", "São gráficos de desenhos em Pixel Art para você reproduzir no pegboard, peça por peça. Todos os kits incluem 100 modelos para começar.", true],
      ["Como recebo os modelos?", "Depois da confirmação do pagamento, o acesso aparece na página do seu pedido. O link fica salvo para você voltar quando quiser.", true],
      ["Posso comprar mais modelos?", "Sim. A biblioteca com 500+ modelos pode ser adicionada ao seu pedido.", true],
      ["Posso comprar pegboards separados?", "[PREENCHER] Ative esta resposta quando os pegboards avulsos estiverem à venda.", false],
      ["Posso comprar pinças separadas?", "[PREENCHER] Ative esta resposta quando as pinças avulsas estiverem à venda.", false],
      ["Quais formas de pagamento?", "No momento aceitamos PIX.", true],
      ["Como funciona o PIX?", "Ao finalizar o pedido geramos um QR Code e um código copia e cola. Pague pelo app do seu banco e a confirmação acontece automaticamente, em poucos instantes.", true],
      ["Como acompanho meu pedido?", "Pela página do pedido, exibida após a compra, ou em [Acompanhar pedido](/acompanhar), informando o número do pedido e o seu e-mail.", true],
      ["Qual a política de troca e devolução?", "Veja a nossa [Política de Troca e Devolução](/trocas-e-devolucoes).", true],
      ["Como falo com o atendimento?", "[PREENCHER] Informe WhatsApp, e-mail e horário de atendimento.", false],
    ];
    await db.faq.createMany({ data: faqs.map(([question, answer, active], i) => ({ question, answer, active, sortOrder: i + 1 })) });
  }

  // ───────────── Modelos de mensagem (recuperação manual) ─────────────
  if ((await db.messageTemplate.count()) === 0) {
    await db.messageTemplate.createMany({
      data: [
        {
          channel: "WHATSAPP",
          name: "PIX pendente",
          body: "Oi, {primeiro_nome}! Aqui é da {loja}. Vi que o PIX do seu pedido {pedido} ({valor}) ainda está pendente. Se quiser concluir, é só acessar: {link}. Qualquer dúvida, estou por aqui!",
        },
        {
          channel: "EMAIL",
          name: "PIX pendente",
          body: "Olá, {primeiro_nome}!\n\nO PIX do seu pedido {pedido} ({valor}) ainda está pendente. Para concluir, acesse: {link}\n\nEquipe {loja}",
        },
      ],
    });
  }

  // ───────────── Teste A/B de exemplo (inativo) ─────────────
  await db.experiment.upsert({
    where: { key: "hero_headline" },
    update: {},
    create: {
      key: "hero_headline",
      name: "Headline do hero",
      target: "hero_headline",
      active: false,
      variants: [
        { key: "a", label: "Controle", weight: 50, value: "" },
        { key: "b", label: "Kit completo", weight: 50, value: "Um kit completo para começar a criar." },
      ],
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
