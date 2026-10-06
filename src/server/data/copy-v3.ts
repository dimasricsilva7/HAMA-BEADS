/**
 * Textos v3 (outubro/2026): landing page humanizada — cenas reais de uso em vez de
 * frases genéricas, menos seções repetidas, FAQ enxuto e informações reais de envio
 * (São Paulo capital → todo o Brasil, 3 a 5 dias úteis).
 *
 * Roda uma única vez por banco (Setting content_version) a partir dos jobs. Seções e
 * perguntas retiradas são apenas desativadas — dá para reativar no admin.
 */
import type { Prisma, PrismaClient } from "@prisma/client";

const VERSION = 3;

type S = { title?: string | null; subtitle?: string | null; body?: string | null; ctaLabel?: string | null; active?: boolean; config?: Record<string, unknown> };

const SECTIONS: Record<string, S> = {
  hero: {
    title: "A peça sai do ferro e todo mundo quer ver.",
    subtitle:
      "Você escolhe o desenho, encaixa as continhas e passa o ferrinho. Na mesma tarde tem chaveiro pronto, feito por você (ou pelo seu filho, que não vai querer parar). Já vem tudo no kit, até 100 desenhos pra começar.",
    ctaLabel: "Quero montar o meu",
    config: { eyebrow: "", stats: [{ value: "até 96", label: "cores" }, { value: "até 59.600", label: "peças" }, { value: "3 a 5", label: "dias úteis pra chegar" }] },
  },
  quick_kits: {
    title: "Quantas cores você quer?",
    subtitle: "Todos vêm com mini ferro, placa, pinças e tecido térmico de brinde. Enviamos de São Paulo e chega em 3 a 5 dias úteis.",
  },
  product_in_use: {
    title: "Começa com um coraçãozinho. Depois ninguém para.",
    body: "O primeiro sai meio torto, e tudo bem. No segundo você já pegou o jeito. Quando vê, tem chaveiro na mochila, ímã na geladeira e porta-copos na mesa da sala. É o tipo de coisa que dá orgulho de mostrar.",
  },
  video: { title: "Do pote de continhas à peça pronta", subtitle: "Assim é uma tarde com o kit." },
  benefits: {
    title: "O que acontece quando o kit chega em casa",
    ctaLabel: "Ver os kits",
    config: {
      items: [
        { icon: "hand", title: "Uma tarde longe do celular", text: "As crianças escolhem as cores, se concentram e a casa fica naquele silêncio bom. Adulto também desliga." },
        { icon: "gift", title: "Presente com a cara da pessoa", text: "O personagem favorito, a inicial do nome, o bichinho de estimação. Vira chaveiro com as argolas que já vêm no kit." },
        { icon: "palette", title: "Pra quem cresceu jogando", text: "O mesmo pixel do videogame de infância, agora na sua mão." },
        { icon: "clock", title: "Fica pronto no mesmo dia", text: "Montou, passou o ferro, esperou esfriar. Já dá pra usar, presentear ou pendurar." },
      ],
    },
  },
  how_it_works: {
    title: "É mais fácil do que parece",
    subtitle: "Seis passos. O único que pede um adulto por perto é o do ferro.",
    ctaLabel: "Escolher minhas cores",
    config: {
      steps: [
        { title: "Escolha o desenho", text: "Pegue um dos 100 modelos que vêm com o kit ou invente o seu." },
        { title: "Separe as cores", text: "A bandeja e as pazinhas ajudam a não espalhar continha pela casa." },
        { title: "Encaixe na placa", text: "Peça por peça, seguindo o desenho. É aqui que bate aquela calma." },
        { title: "Passe o ferrinho", text: "Cubra com o papel manteiga e passe o mini ferro, seguindo as instruções." },
        { title: "Espere esfriar", text: "Aguarde a peça esfriar antes de tirar da placa." },
        { title: "Pronto, é seu", text: "Agora é pendurar, presentear ou guardar de lembrança." },
      ],
    },
  },
  led_board: {
    title: "Pegboard LED: o desenho acende na placa e você só encaixa por cima",
    subtitle: "Você escolhe o desenho no celular e ele aparece iluminado na placa. Ótimo pra quem tem medo de errar e pras crianças, que é só seguir a luz.",
    config: { offerNote: "Esse preço só aparece no checkout, comprando junto com o seu kit." },
  },
  gallery: { title: "Feito com continhas", subtitle: "Umas ideias pra você começar.", ctaLabel: "Quero fazer o meu" },
  inspiration: { active: false },
  audience_kids: { active: false },
  audience_adults: { active: false },
  kits: {
    title: "Qual kit é o seu?",
    subtitle: "Todos vêm com as mesmas ferramentas e acessórios. Muda a quantidade de cores e de peças: quanto mais cores, mais detalhe nos desenhos.",
  },
  offer: {
    title: "Tudo isso chega na sua casa",
    subtitle: "Esse é o Kit Mestre 96 Cores. Os outros vêm com os mesmos itens, só com menos cores e peças.",
    ctaLabel: "Quero o de 96 cores",
  },
  models_included: {
    title: "Você não vai travar no primeiro desenho",
    body: "Todo kit vem com 100 modelos prontos pra seguir: escolhe, separa as cores e monta. Perfeito pra quem nunca fez e não sabe por onde começar.",
    ctaLabel: "Ver os kits",
  },
  complete_kit: { title: "Pegou gosto?", subtitle: "Placas maiores e ferramentas pra ir além." },
  library: { title: "Acabaram as ideias?", subtitle: "Mais 500 modelos separados por tema: games, bichinhos, kawaii, comidas e muito mais." },
  reviews: { title: "Quem já recebeu em casa" },
  faq: { title: "Ficou alguma dúvida?" },
  trust: {
    title: "Pode comprar tranquilo",
    config: {
      items: [
        { icon: "truck", title: "Enviamos de São Paulo", text: "Para todo o Brasil, com entrega em 3 a 5 dias úteis." },
        { icon: "pix", title: "Pagamento por PIX", text: "Confirmação automática, processada pela BravoPay." },
        { icon: "shield", title: "Seus dados ficam com a gente", text: "Usados só para processar e entregar o seu pedido." },
        { icon: "chat", title: "Gente de verdade do outro lado", text: "Qualquer dúvida, é só escrever pra pedidos@hamabeads.site." },
      ],
    },
  },
  final_cta: {
    title: "A primeira peça é a mais gostosa de fazer.",
    subtitle: "Escolha suas cores hoje. Em 3 a 5 dias úteis o kit está na sua casa.",
    ctaLabel: "Escolher meu kit",
  },
};

/** Uma frase por kit, para ajudar a escolher (aparece no card e no atalho de compra). */
const KIT_TAGLINES: Record<string, string> = {
  "kit-24-cores": "Pra experimentar e descobrir se vira hobby.",
  "kit-48-cores": "Pra personagens com sombra e mais detalhe.",
  "kit-72-cores": "Pra família toda montar junto sem disputar cor.",
  "kit-96-cores": "Pra nunca faltar cor. É o que a gente escolheria.",
};

/** Perguntas que continuam visíveis (as demais são desativadas, não apagadas). */
const FAQ_KEEP = [
  "O que acompanha cada kit?",
  "Qual a diferença entre os kits?",
  "Qual o tamanho das peças?",
  "O que é o Pegboard LED?",
  "Como recebo os modelos?",
  "Como funciona o PIX?",
  "Qual a política de troca e devolução?",
  "Dá para fazer chaveiros e pingentes?",
];
const FAQ_NEW = [
  {
    question: "Em quanto tempo chega?",
    answer: "Enviamos de São Paulo (capital) para todo o Brasil, com prazo de entrega de 3 a 5 dias úteis. Você acompanha tudo pela página do pedido.",
  },
  {
    question: "Criança consegue montar?",
    answer: "Consegue, e costuma amar: separar as cores e encaixar as peças na placa é a parte favorita delas. Só a finalização com o mini ferro precisa de um adulto, porque ele esquenta.",
  },
];

export async function applyCopyV3(db: PrismaClient, opts: { force?: boolean } = {}) {
  const current = await db.setting.findUnique({ where: { key: "content_version" } });
  if (!opts.force && Number(current?.value ?? 0) >= VERSION) return { skipped: true as const };
  const log: string[] = [];

  for (const [key, s] of Object.entries(SECTIONS)) {
    const row = await db.landingSection.findUnique({ where: { key } });
    if (!row) continue;
    const { config, ...fields } = s;
    const data: Prisma.LandingSectionUpdateInput = { ...fields };
    if (config) data.config = { ...((row.config as Record<string, unknown>) ?? {}), ...config } as Prisma.InputJsonValue;
    await db.landingSection.update({ where: { key }, data });
    log.push(key);
  }

  for (const [slug, tagline] of Object.entries(KIT_TAGLINES)) {
    await db.product.updateMany({ where: { slug }, data: { shortDescription: tagline } });
  }

  const faqs = await db.faq.findMany();
  const norm = (q: string) => q.trim().toLowerCase();
  const keep = FAQ_KEEP.map(norm);
  for (const f of faqs) {
    const i = keep.indexOf(norm(f.question));
    await db.faq.update({ where: { id: f.id }, data: i >= 0 ? { active: true, sortOrder: i < 2 ? i : i + 2 } : { active: false } });
  }
  for (const [i, f] of FAQ_NEW.entries()) {
    const existing = faqs.find((x) => norm(x.question) === norm(f.question));
    if (existing) await db.faq.update({ where: { id: existing.id }, data: { answer: f.answer, active: true, sortOrder: 2 + i } });
    else await db.faq.create({ data: { ...f, active: true, sortOrder: 2 + i } });
  }

  const setIfEmpty = async (key: string, value: string) => {
    const row = await db.setting.findUnique({ where: { key } });
    if (!row || !String(row.value ?? "").trim()) await db.setting.upsert({ where: { key }, update: { value, updatedBy: "copy-v3" }, create: { key, value, updatedBy: "copy-v3" } });
  };
  await setIfEmpty("announcement_text", "Enviamos de SP para todo o Brasil · 3 a 5 dias úteis");
  await setIfEmpty("footer_text", "Loja de São Paulo (SP). Kits de Hama Beads para criar Pixel Art em casa, com envio para todo o Brasil.");

  await db.setting.upsert({ where: { key: "content_version" }, update: { value: String(VERSION), updatedBy: "copy-v3" }, create: { key: "content_version", value: String(VERSION), updatedBy: "copy-v3" } });
  return { applied: log.length, sections: log };
}
