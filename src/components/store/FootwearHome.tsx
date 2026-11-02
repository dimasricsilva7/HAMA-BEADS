"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FavoriteButton } from "@/components/store/FavoriteButton";
import { CampaignTag } from "@/components/store/CampaignTag";
import { crocsColorBackground } from "@/lib/crocs-colors";
import type { ProductColorFamilyItem } from "@/types/catalog";

type MiniProduct = {
  id: string; name: string; slug: string; sku: string; priceCents: number; listPriceCents: number | null;
  individualDiscountPercent: number | null; imageUrl: string | null; badge: string | null; category: string;
  sourceCollectionId: string | null; sourceCollectionIds: string[]; stockStatus: string;
  shortDescription: string | null; brandName: string | null; featured: boolean;
  homeBlackFriday: boolean; homeFeaturedOffer: boolean; colorFamily: ProductColorFamilyItem[];
  variants: { options: { name: string; value: string }[] }[];
};

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const discount = (p: MiniProduct) => p.listPriceCents && p.listPriceCents > p.priceCents
  ? Math.round((1 - p.priceCents / p.listPriceCents) * 100)
  : p.individualDiscountPercent;
const sourceIn = (p: MiniProduct, ...ids: string[]) => ids.some((id) => p.sourceCollectionIds.includes(id) || p.sourceCollectionId === id);
const isBlackFriday = (p: MiniProduct) => p.homeBlackFriday || sourceIn(p, "595", "596", "599") || (p.badge?.toLowerCase().includes("black") ?? false);

function ProductCard({ product }: { product: MiniProduct }) {
  const off = discount(product);
  const colors = product.category === "JIBBITZ" ? [] : product.colorFamily;
  const bf = isBlackFriday(product);
  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link href={`/produto/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[15px] bg-[#f6f5ef]">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="(min-width:1200px) 19vw,(min-width:640px) 40vw,76vw"
              className="object-contain p-3 transition duration-300 group-hover:scale-[1.035] sm:p-4" />
          ) : <span className="grid h-full place-items-center text-sm text-[#777]">Imagem indisponível</span>}
          {bf && <span className="absolute bottom-3 left-3"><CampaignTag discountPercent={off} /></span>}
        </Link>
        <FavoriteButton productId={product.id} className="absolute left-3 top-3" />
      </div>
      {bf ? <div className="mt-3 h-2.5" /> : <div className="mt-4 h-1" />}
      {colors.length > 0 && (
        <div className="mt-1 flex min-h-5 flex-wrap items-center gap-1.5" aria-label={`${colors.length} cores disponíveis`}>
          {colors.map((color) => <span key={color.id} title={color.value} aria-label={color.value}
            className="h-[13px] w-[13px] shrink-0 rounded-full border border-black/15"
            style={{ background: crocsColorBackground(color.value) }} />)}
        </div>
      )}
      {product.category === "JIBBITZ" && (
        <p className="mt-2 min-h-4 text-[10px] font-semibold uppercase tracking-wide text-[#747474]">Personagens e temas</p>
      )}
      <Link href={`/produto/${product.slug}`} className="mt-3 block">
        <span className="block min-h-[42px] text-[15px] font-extrabold leading-5 text-[#171717] hover:underline">{product.name}</span>
        <span className="mt-3 block min-h-[42px]">
          {product.listPriceCents && product.listPriceCents > product.priceCents && <span className="block text-sm text-[#636363] line-through">{money(product.listPriceCents)}</span>}
          <span className="block text-[21px] font-extrabold leading-6 text-[#4f9825]">{money(product.priceCents)}</span>
        </span>
      </Link>
      <Link href={`/produto/${product.slug}`} className="mt-3 flex min-h-10 items-center justify-center rounded-full bg-[#222] px-3 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#84bd45] hover:text-[#17230d]">
        Adicionar ao carrinho
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
      <button type="button" onClick={() => scroll(-1)} aria-label="Ver produtos anteriores" className="absolute -left-4 top-[35%] z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#dedede] bg-white shadow-sm lg:grid">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div ref={rail} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 sm:gap-5">
        {products.map((p) => <div key={p.id} className="w-[76vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-80px)/5)]"><ProductCard product={p} /></div>)}
      </div>
      <button type="button" onClick={() => scroll(1)} aria-label="Ver próximos produtos" className="absolute -right-4 top-[35%] z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#dedede] bg-white shadow-sm lg:grid">
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
  return <Link href={href} className="group relative isolate flex min-h-[220px] overflow-hidden rounded-[16px] bg-[#e9e6dc] p-5 text-[#202020] sm:min-h-[280px] sm:p-7">
    {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width:768px) 50vw,100vw" className="object-contain object-right p-2 mix-blend-multiply transition duration-500 group-hover:scale-[1.025] sm:p-4" />}
    <span className="absolute inset-0 bg-gradient-to-r from-[#e9e6dc] via-[#e9e6dc]/90 to-[#e9e6dc]/5" />
    <span className="relative mt-auto block max-w-sm">
      <span className="block text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4e7f2f]">{eyebrow}</span>
      <span className="mt-2 block text-2xl font-extrabold leading-tight text-[#171717] sm:text-3xl">{title}</span>
      <span className="mt-2 block text-sm leading-5 text-[#555]">{description}</span>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#222]">Explorar coleção <span aria-hidden="true">→</span></span>
    </span>
  </Link>;
}

export default function FootwearHome({ products, storeName, heroImageUrl }: {
  products: MiniProduct[]; storeName: string; heroImageUrl?: string | null;
}) {
  const adult = products.filter((p) => sourceIn(p, "111", "146"));
  const kids = products.filter((p) => sourceIn(p, "173") || p.category === "KIDS");
  const jibbitz = products.filter((p) => sourceIn(p, "215") || p.category === "JIBBITZ");
  const sale = products.filter((p) => p.homeBlackFriday || sourceIn(p, "595", "596", "599"))
    .sort((a,b) => (discount(b) ?? 0) - (discount(a) ?? 0));
  const featuredOffers = products.filter((p) => p.homeFeaturedOffer);
  const bestSellers = products.filter((p) => p.featured);
  const highlights = (bestSellers.length ? bestSellers : adult).slice(0, 10);
  const categoryTiles = [
    { id: "adult", href: "/loja?colecao=111,146", image: "/images/category-adulto.webp", alt: "Adulto" },
    { id: "kids", href: "/loja?colecao=173", image: "/images/category-infantil.webp", alt: "Infantil" },
    { id: "jibbitz", href: "/loja?colecao=215", image: "/images/category-jibbitz.webp", alt: "Jibbitz" },
  ];

  return <main className="min-h-screen bg-white text-[#242424]" aria-label={`${storeName} — loja independente`}>
    <section className="mx-auto max-w-[1600px] px-3 pt-4 sm:px-6 lg:px-8">
      {heroImageUrl ? <Link href="/loja?colecao=595,596,599" className="relative block aspect-[16/5] min-h-[190px] overflow-hidden rounded-[16px] bg-[#141414] sm:min-h-[270px]">
        <Image src={heroImageUrl} alt="Campanha promocional da loja" fill priority sizes="100vw" className="object-cover" />
      </Link> : <div className="relative grid min-h-[330px] overflow-hidden rounded-[16px] bg-[#151a15] text-white sm:min-h-[420px] sm:grid-cols-[1fr_1fr]">
        <div className="relative z-10 flex flex-col items-start justify-center px-6 py-10 sm:px-10 lg:px-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#b5df76]">Novembro de ofertas</p>
          <h1 className="mt-3 max-w-xl text-4xl font-black leading-[.98] tracking-tight sm:text-6xl">BLACK<br />NOVEMBER</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">Explore os modelos disponíveis, compare cores e escolha seu próximo par.</p>
          <Link href="/loja?colecao=595,596,599" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#a0d36c] px-6 text-xs font-extrabold uppercase tracking-wide text-[#17230d]">Ver ofertas</Link>
          <p className="mt-4 text-[10px] text-white/60">Loja independente · consulte as condições de cada produto</p>
        </div>
        <div className="relative grid min-h-[220px] grid-cols-2 items-center gap-1 bg-[#e9e6dc] px-3 py-5 sm:min-h-0 sm:px-7">
          {highlights.slice(0, 2).map((p, i) => <Link key={p.id} href={`/produto/${p.slug}`} className={`relative aspect-[4/5] overflow-hidden bg-transparent ${i === 1 ? "mt-8" : ""}`}>
            {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width:640px) 22vw,42vw" className="object-contain mix-blend-multiply p-0 sm:p-1" />}
          </Link>)}
        </div>
      </div>}
    </section>

    <section className="mx-auto max-w-[1480px] px-4 pt-7 sm:px-7 lg:px-10" aria-label="Comprar por coleção">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {categoryTiles.map((tile) => <Link key={tile.id} href={tile.href} aria-label={`Comprar ${tile.alt}`} className="group relative block aspect-[2.12/1] overflow-hidden rounded-[12px] bg-[#f3f3f1]">
          <Image src={tile.image} alt={tile.alt} fill sizes="33vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
        </Link>)}
      </div>
    </section>

    <Section id="ofertas-black-friday" eyebrow="Black November" title="Ofertas Black Friday" description="Produtos selecionados para a campanha." products={sale.slice(0, 10)} href="/loja?colecao=595,596,599" />
    <Section id="ofertas-destaque" eyebrow="Seleção especial" title="Ofertas em destaque" description="Produtos que você selecionou no painel administrativo." products={featuredOffers.slice(0, 10)} href="/loja?ofertas=1" />
    <Section id="mais-vendidos" eyebrow="Mais procurados" title="Mais vendidos" description="Produtos selecionados no painel administrativo." products={bestSellers.slice(0, 10)} />

    {jibbitz.length > 0 && <section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10">
      <div className="relative isolate flex min-h-[190px] items-center overflow-hidden rounded-[16px] bg-[#eaf1e0] p-6 sm:min-h-[250px] sm:p-10">
        <span className="absolute inset-0 bg-gradient-to-r from-[#101b0b]/95 via-[#101b0b]/70 to-[#101b0b]/10" />
        <div className="relative max-w-lg text-white"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#c4e998]">Personalize seu estilo</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Um detalhe muda tudo.</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">Encontre personagens, temas e acessórios para dar personalidade ao seu calçado.</p>
          <Link href="/loja?colecao=215" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-xs font-extrabold uppercase tracking-wide text-[#1c2915]">Explorar Jibbitz</Link>
        </div>
      </div>
    </section>}
    <Section id="jibbitz" eyebrow="Acessórios" title="Jibbitz e personagens" description="Personagens, temas e packs para personalizar seu calçado." products={jibbitz.slice(0, 10)} href="/loja?colecao=215" />

    <section className="mx-auto grid max-w-[1480px] gap-3 px-4 py-6 sm:grid-cols-2 sm:gap-5 sm:px-7 lg:px-10">
      <PromoTile title="Encontre seu próximo par" eyebrow="Coleção adulto" description="Explore diferentes modelos e cores para o dia a dia." href="/loja?colecao=111,146" imageUrl={adult[0]?.imageUrl} />
      <PromoTile title="Conforto para acompanhar cada passo" eyebrow="Coleção infantil" description="Veja os modelos infantis disponíveis e escolha o tamanho." href="/loja?colecao=173" imageUrl={kids[0]?.imageUrl} />
    </section>

    <Section id="adulto" eyebrow="Coleção" title="Adulto" description="Clogs, sandálias e slides para diferentes estilos." products={adult.slice(0, 10)} href="/loja?colecao=111,146" />
    <Section id="infantil" eyebrow="Coleção" title="Infantil" description="Confira os modelos e tamanhos disponíveis." products={kids.slice(0, 10)} href="/loja?colecao=173" />

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
