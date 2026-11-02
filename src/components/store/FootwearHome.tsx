"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FavoriteButton } from "@/components/store/FavoriteButton";

type MiniProduct = {
  id: string; name: string; slug: string; sku: string; priceCents: number; listPriceCents: number | null;
  imageUrl: string | null; badge: string | null; category: string; sourceCollectionId: string | null;
  stockStatus: string; shortDescription: string | null; brandName: string | null; featured?: boolean;
  variants: { options: { name: string; value: string }[] }[];
};

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const discount = (p: MiniProduct) => p.listPriceCents && p.listPriceCents > p.priceCents
  ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : null;
const colorMap: [RegExp, string][] = [
  [/white|branco|off white|cream|ivory|winter white/, "#f7f4e9"], [/black|preto|noir/, "#171717"],
  [/blue|azul|navy|teal/, "#2874b8"], [/pink|rosa/, "#e88da9"], [/red|vermelho/, "#c33a42"],
  [/green|verde|olive/, "#6a8d43"], [/yellow|amarelo|gold/, "#e6c64f"], [/purple|roxo|lilac|lavender/, "#9b80b9"],
  [/brown|marrom/, "#8c5a3c"], [/grey|gray|cinza|slate/, "#888b8e"], [/beige|bege|sand|areia|khaki/, "#c8b994"],
];
function colorHex(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return colorMap.find(([pattern]) => pattern.test(normalized))?.[1] ?? "#c8c8c8";
}

function ProductCard({ product }: { product: MiniProduct }) {
  const off = discount(product);
  const colors = [...new Set(product.variants.flatMap((v) => v.options.filter((o) => /^(cor|color|colour)$/i.test(o.name)).map((o) => o.value)))];
  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link href={`/produto/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[15px] bg-[#f6f5ef]">
          {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(min-width:1200px) 19vw,(min-width:640px) 40vw,76vw" className="object-contain p-3 transition duration-300 group-hover:scale-[1.035] sm:p-4" /> :
            <span className="grid h-full place-items-center text-sm text-[#777]">Imagem indisponível</span>}
          {product.badge && <span className="absolute bottom-3 left-3 rounded-full bg-[#bd2457] px-3 py-1 text-[9px] font-extrabold uppercase text-white">{product.badge}</span>}
        </Link>
        <FavoriteButton productId={product.id} className="absolute left-3 top-3" />
      </div>
      {off !== null ? <div className="mt-4 flex items-center gap-1.5"><span className="h-7 flex-1 rounded-full bg-[#9fd06e]" /><span className="rounded-full border border-[#5b9f2e] px-3 py-1 text-xs font-extrabold text-[#4f9825]">-{off}%</span></div> : <div className="mt-4 h-7" />}
      {colors.length > 0 && <div className="mt-2 flex min-h-5 items-center gap-1.5" aria-label={`${colors.length} cores disponíveis`}>
        {colors.slice(0, 8).map((color) => <span key={color} title={color} className="h-[13px] w-[13px] shrink-0 rounded-full border border-black/15" style={{ backgroundColor: colorHex(color) }} />)}
        {colors.length > 8 && <span className="text-[11px] text-[#222]">+{colors.length - 8}</span>}
      </div>}
      <Link href={`/produto/${product.slug}`} className="mt-3 block">
        <span className="block min-h-[42px] text-[15px] font-extrabold leading-5 text-[#171717] hover:underline">{product.name}</span>
        <span className="mt-3 block min-h-[42px]">
          {product.listPriceCents && product.listPriceCents > product.priceCents && <span className="block text-sm text-[#636363] line-through">{money(product.listPriceCents)}</span>}
          <span className="block text-[21px] font-extrabold leading-6 text-[#4f9825]">{money(product.priceCents)}</span>
        </span>
      </Link>
    </article>
  );
}

function ProductRail({ products }: { products: MiniProduct[] }) {
  const rail = useRef<HTMLDivElement>(null);
  if (!products.length) return null;
  const scroll = (direction: -1 | 1) => rail.current?.scrollBy({ left: direction * Math.max(280, (rail.current?.clientWidth ?? 0) * .82), behavior: "smooth" });
  return (
    <div className="relative">
      <button type="button" onClick={() => scroll(-1)} aria-label="Ver produtos anteriores" className="absolute -left-4 top-[34%] z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#dedede] bg-white shadow-sm lg:grid">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div ref={rail} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 sm:gap-5">
        {products.map((p) => <div key={p.id} className="w-[76vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-80px)/5)]"><ProductCard product={p} /></div>)}
      </div>
      <button type="button" onClick={() => scroll(1)} aria-label="Ver próximos produtos" className="absolute -right-4 top-[34%] z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#dedede] bg-white shadow-sm lg:grid">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  );
}

function Section({ id, eyebrow, title, description, products, href = "/loja", cta = "Ver todos" }: {
  id: string; eyebrow?: string; title: string; description?: string; products: MiniProduct[]; href?: string; cta?: string;
}) {
  if (!products.length) return null;
  return <section id={id} className="mx-auto max-w-[1480px] px-4 py-9 sm:px-7 sm:py-12 lg:px-10">
    <div className="mb-5 flex items-end justify-between gap-4"><div>
      {eyebrow && <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#60952d]">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1e1e1e] sm:text-3xl">{title}</h2>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-[#686868]">{description}</p>}
    </div><Link href={href} className="shrink-0 text-xs font-bold text-[#222] underline underline-offset-4">{cta}</Link></div>
    <ProductRail products={products} />
  </section>;
}

function PromoTile({ title, eyebrow, description, href, imageUrl }: { title: string; eyebrow: string; description: string; href: string; imageUrl?: string | null }) {
  return <Link href={href} className="group relative isolate flex min-h-[220px] overflow-hidden rounded-[16px] bg-[#20251c] p-5 text-white sm:min-h-[280px] sm:p-7">
    {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width:768px) 50vw,100vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />}
    <span className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/5" />
    <span className="relative mt-auto block max-w-sm">
      <span className="block text-[10px] font-extrabold uppercase tracking-[.18em] text-[#c7eb92]">{eyebrow}</span>
      <span className="mt-2 block text-2xl font-extrabold leading-tight sm:text-3xl">{title}</span>
      <span className="mt-2 block text-sm leading-5 text-white/80">{description}</span>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide">Explorar coleção <span aria-hidden="true">→</span></span>
    </span>
  </Link>;
}

export default function FootwearHome({ products, storeName, heroImageUrl, adultBannerUrl, kidsBannerUrl, jibbitzBannerUrl }: {
  products: MiniProduct[]; storeName: string; heroImageUrl?: string | null; adultBannerUrl?: string | null; kidsBannerUrl?: string | null; jibbitzBannerUrl?: string | null;
}) {
  const adult = products.filter((p) => p.sourceCollectionId === "596");
  const kids = products.filter((p) => p.sourceCollectionId === "597" || p.category === "KIDS");
  const jibbitz = products.filter((p) => p.sourceCollectionId === "469" || p.category === "JIBBITZ");
  const sale = products.filter((p) => p.listPriceCents && p.listPriceCents > p.priceCents).sort((a,b) => (discount(b) ?? 0) - (discount(a) ?? 0));
  const featured = products.filter((p) => p.featured);
  const highlights = (featured.length ? featured : adult.length ? adult : products).slice(0,10);
  const categories = [
    { id: "adult", title: "Adulto", description: "Clogs, sandálias e slides", href: "/loja?colecao=596", imageUrl: adultBannerUrl || adult[0]?.imageUrl },
    { id: "kids", title: "Infantil", description: "Modelos para os pequenos", href: "/loja?colecao=597", imageUrl: kidsBannerUrl || kids[0]?.imageUrl },
    { id: "jibbitz", title: "Jibbitz", description: "Personalize seu estilo", href: "/loja?colecao=469", imageUrl: jibbitzBannerUrl || jibbitz[0]?.imageUrl },
  ];
  return <main className="min-h-screen bg-white text-[#242424]" aria-label={`${storeName} — loja independente`}>
    <section className="mx-auto max-w-[1600px] px-3 pt-4 sm:px-6 lg:px-8">
      {heroImageUrl ? <Link href="/loja?ofertas=1" className="relative block aspect-[16/5] min-h-[190px] overflow-hidden rounded-[16px] bg-[#141414] sm:min-h-[270px]">
        <Image src={heroImageUrl} alt="Campanha promocional da loja" fill priority sizes="100vw" className="object-cover" />
      </Link> : <div className="relative grid min-h-[340px] overflow-hidden rounded-[16px] bg-[#101410] text-white sm:min-h-[420px] sm:grid-cols-[1.08fr_.92fr]">
        <div className="relative z-10 flex flex-col items-start justify-center px-6 py-10 sm:px-10 lg:px-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#b5df76]">Novembro de ofertas</p>
          <h1 className="mt-3 max-w-xl text-4xl font-black leading-[.98] tracking-tight sm:text-6xl">BLACK<br />NOVEMBER</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">Explore os modelos disponíveis, compare cores e escolha seu próximo par.</p>
          <Link href="/loja?ofertas=1" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#a0d36c] px-6 text-xs font-extrabold uppercase tracking-wide text-[#17230d]">Ver ofertas</Link>
          <p className="mt-4 text-[10px] text-white/60">Loja independente · consulte as condições de cada produto</p>
        </div>
        <div className="relative grid min-h-[220px] grid-cols-2 items-center gap-2 px-5 pb-5 sm:min-h-0 sm:pr-10 sm:pt-8">
          {highlights.slice(0,2).map((p,i) => <Link key={p.id} href={`/produto/${p.slug}`} className={`relative aspect-[4/5] overflow-hidden rounded-xl bg-white/10 ${i===1 ? "mt-10" : ""}`}>
            {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width:640px) 22vw,42vw" className="object-contain p-2 sm:p-4" />}
          </Link>)}
        </div>
      </div>}
    </section>

    <section className="mx-auto max-w-[1480px] px-4 pt-7 sm:px-7 lg:px-10" aria-label="Comprar por coleção">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {categories.map((c) => <Link key={c.id} href={c.href} className="group relative isolate flex min-h-[130px] overflow-hidden rounded-xl bg-[#1a2115] p-3 sm:min-h-[190px] sm:p-5">
          {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />}
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
          <span className="relative mt-auto text-white"><span className="block text-sm font-extrabold sm:text-xl">{c.title}</span>
            <span className="mt-1 hidden text-xs text-white/80 sm:block">{c.description}</span><span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-[#c9e99e]">Comprar agora →</span></span>
        </Link>)}
      </div>
    </section>

    <Section id="ofertas" eyebrow="Black November" title="Ofertas em destaque" description="Produtos com preço promocional cadastrado na loja." products={sale.slice(0,10)} href="/loja?ofertas=1" />
    <Section id="destaques" eyebrow="Seleção da loja" title="Destaques" description="Modelos selecionados para conhecer a coleção." products={highlights} />

    <Section id="jibbitz-oferta" eyebrow="Oferta especial" title="Compre 8 Jibbitz e Pague 5" description="Adicione oito itens participantes ao carrinho; o desconto aplicável é calculado automaticamente no pedido." products={jibbitz.slice(0,10)} href="/loja?colecao=469" cta="Ver Jibbitz" />

    <section className="mx-auto max-w-[1480px] px-4 pb-7 pt-3 sm:px-7 lg:px-10">
      <div className="rounded-[16px] bg-[#101410] px-5 py-7 text-white sm:px-9 sm:py-9">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#c5e99a]">Encontre sua oferta</p>
        <h2 className="mt-1 text-2xl font-black sm:text-3xl">Ofertas por faixa de preço</h2>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { label: "Até R$ 149", min: 0, max: 14900 },
            { label: "De R$ 150 a R$ 249", min: 15000, max: 24900 },
            { label: "A partir de R$ 250", min: 25000, max: 0 },
          ].map((range) => (
            <Link key={range.label} href={`/loja?precoDe=${range.min}&precoAte=${range.max}`} className="flex min-h-12 items-center justify-between rounded-lg bg-white px-4 text-sm font-bold text-[#222] transition hover:bg-[#edf5e4]">
              {range.label}<span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto grid max-w-[1480px] gap-3 px-4 py-6 sm:grid-cols-2 sm:gap-5 sm:px-7 lg:px-10">
      <PromoTile title="Encontre seu próximo par" eyebrow="Coleção adulto" description="Explore diferentes modelos e cores para o dia a dia." href="/loja?colecao=596" imageUrl={adultBannerUrl || adult[1]?.imageUrl || adult[0]?.imageUrl} />
      <PromoTile title="Conforto para acompanhar cada passo" eyebrow="Coleção infantil" description="Veja os modelos infantis disponíveis e escolha o tamanho." href="/loja?colecao=597" imageUrl={kidsBannerUrl || kids[0]?.imageUrl} />
    </section>

    <Section id="adulto" eyebrow="Coleção" title="Adulto" description="Clogs, sandálias e slides em diferentes cores." products={adult.slice(0,10)} href="/loja?colecao=596" />
    <Section id="infantil" eyebrow="Coleção" title="Infantil" description="Confira os modelos e tamanhos disponíveis." products={kids.slice(0,10)} href="/loja?colecao=597" />

    {jibbitz.length > 0 && <section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10">
      <div className="relative isolate flex min-h-[190px] items-center overflow-hidden rounded-[16px] bg-[#eaf1e0] p-6 sm:min-h-[250px] sm:p-10">
        {jibbitzBannerUrl && <Image src={jibbitzBannerUrl} alt="" fill sizes="100vw" className="object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-r from-[#101b0b]/90 via-[#101b0b]/60 to-transparent" />
        <div className="relative max-w-lg text-white"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#c4e998]">Personalize seu estilo</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Um detalhe muda tudo.</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">Encontre acessórios e Jibbitz disponíveis para personalizar seu calçado.</p>
          <Link href="/loja?colecao=469" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-xs font-extrabold uppercase tracking-wide text-[#1c2915]">Explorar Jibbitz</Link>
        </div>
      </div>
    </section>}
    <Section id="jibbitz" eyebrow="Acessórios" title="Jibbitz e acessórios" description="Peças para dar personalidade ao seu calçado." products={jibbitz.slice(0,10)} href="/loja?colecao=469" />

    <section className="mx-auto max-w-[1480px] px-4 pb-12 pt-4 sm:px-7 lg:px-10">
      <div className="grid gap-3 border-y border-[#e8e8e8] py-6 sm:grid-cols-3 sm:gap-6">
        {[
          ["Compra protegida","Condições claras no checkout"],
          ["Acompanhe seu pedido","Consulte as atualizações da compra"],
          ["Atendimento","Canais disponíveis no rodapé"]
        ].map(([title,sub]) => <div key={title} className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e5e5e5] text-[#4e8e28]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>
          </span><span><b className="block text-sm">{title}</b><small className="text-xs text-[#777]">{sub}</small></span>
        </div>)}
      </div>
      <p className="mt-6 text-center text-[10px] leading-5 text-[#777]">Loja independente. Não somos a loja oficial da Crocs e não representamos a marca. Nomes e marcas pertencem aos respectivos titulares.</p>
    </section>
  </main>;
}
