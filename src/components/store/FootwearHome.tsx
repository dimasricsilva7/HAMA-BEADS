"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type MiniProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  listPriceCents: number | null;
  imageUrl: string | null;
  badge: string | null;
  category: string;
  sourceCollectionId: string | null;
  stockStatus: string;
  shortDescription: string | null;
};

const CATEGORY: Record<string, string> = {
  CLOGS: "Clogs", SANDALS: "Sandálias", SLIDES: "Slides", KIDS: "Infantil",
  JIBBITZ: "Jibbitz", FOOTWEAR: "Calçados", ACCESSORY: "Acessórios", OTHER: "Outros",
};
const money = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const percentOff = (p: MiniProduct) => p.listPriceCents && p.listPriceCents > p.priceCents
  ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : null;

function ProductCard({ p }: { p: MiniProduct }) {
  const discount = percentOff(p);
  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/produto/${p.slug}`} className="relative block aspect-square overflow-hidden bg-[#f5f5f5]">
        {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width: 1100px) 20vw, (min-width: 640px) 33vw, 72vw" className="object-cover transition duration-300 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center text-sm font-semibold text-[#777]">Imagem indisponível</div>}
        {discount !== null && <span className="absolute left-3 top-3 rounded-md bg-[#84BD00] px-2.5 py-1 text-[11px] font-extrabold text-[#1b1b1b]">-{discount}%</span>}
        {p.badge && <span className="absolute right-3 top-3 rounded-md bg-[#333] px-2.5 py-1 text-[10px] font-bold text-white">{p.badge}</span>}
      </Link>
      <div className="p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#777]">{CATEGORY[p.category] ?? "Calçados"}</p>
        <Link href={`/produto/${p.slug}`} className="mt-1 block min-h-10 text-sm font-bold leading-5 text-[#252525] hover:underline">{p.name}</Link>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-extrabold text-[#222]">{money(p.priceCents)}</span>
          {p.listPriceCents && p.listPriceCents > p.priceCents && <span className="text-xs text-[#888] line-through">{money(p.listPriceCents)}</span>}
        </div>
        <Link href={`/produto/${p.slug}`} className="mt-3 flex min-h-10 items-center justify-center rounded-full bg-[#222] px-4 text-xs font-bold text-white transition hover:bg-[#84BD00] hover:text-[#222]">
          {p.category === "JIBBITZ" ? "Ver detalhe" : "Escolher opções"}
        </Link>
      </div>
    </article>
  );
}

function ProductRail({ products }: { products: MiniProduct[] }) {
  if (!products.length) return <div className="rounded-xl border border-dashed border-[#ddd] px-5 py-12 text-center text-sm text-[#777]">Os produtos desta vitrine aparecerão após a sincronização do catálogo.</div>;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{products.map(p => <ProductCard key={p.id} p={p}/>)}</div>;
}

function Section({ id, eyebrow, title, description, products, href = "/loja", cta = "Ver todos" }: {
  id: string; eyebrow?: string; title: string; description?: string; products: MiniProduct[]; href?: string; cta?: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-[1440px] px-4 py-9 sm:px-7 sm:py-12 lg:px-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#608900]">{eyebrow}</p>}
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#242424] sm:text-3xl">{title}</h2>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-[#686868]">{description}</p>}
        </div>
        <Link href={href} className="shrink-0 text-xs font-bold text-[#242424] underline underline-offset-4">{cta}</Link>
      </div>
      <ProductRail products={products}/>
    </section>
  );
}

export default function FootwearHome({ products, storeName, heroImageUrl }: { products: MiniProduct[]; storeName: string; heroImageUrl?: string | null }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => products.filter(p => `${p.name} ${CATEGORY[p.category] ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [products, search]);
  const adult = filtered.filter(p => p.sourceCollectionId === "596");
  const kids = filtered.filter(p => p.sourceCollectionId === "597" || p.category === "KIDS");
  const jibbitz = filtered.filter(p => p.sourceCollectionId === "469" || p.category === "JIBBITZ");
  const sale = filtered.filter(p => p.listPriceCents && p.listPriceCents > p.priceCents).sort((a,b) => (percentOff(b) ?? 0) - (percentOff(a) ?? 0));
  const prices = [
    { label: "Até R$ 199", max: 19900 },
    { label: "R$ 200 a R$ 299", max: 29900, min: 20000 },
    { label: "R$ 300 a R$ 399", max: 39900, min: 30000 },
  ];
  const categories = [
    { id: "596", title: "Adulto", description: "Clogs, sandálias, slides e modelos para adultos", href: "/loja?colecao=596" },
    { id: "597", title: "Infantil", description: "Modelos infantis e juvenis", href: "/loja?colecao=597" },
    { id: "469", title: "Jibbitz", description: "Pins, charms e acessórios para personalizar", href: "/loja?colecao=469" },
  ];
  return (
    <main className="min-h-screen bg-white text-[#242424]">
      <div className="mx-auto max-w-[1440px] px-4 pt-5 sm:px-7 lg:px-10">
        <nav aria-label="Coleções principais" className="grid grid-cols-3 gap-2 sm:gap-4">
          {categories.map(c => (
            <Link key={c.id} href={c.href} className="group rounded-xl border border-[#e5e5e5] bg-white px-3 py-4 text-center transition hover:border-[#84BD00] hover:bg-[#f7faef] sm:py-5">
              <span className="block text-sm font-extrabold sm:text-lg">{c.title}</span>
              <span className="mt-1 hidden text-xs text-[#737373] sm:block">{c.description}</span>
              <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider text-[#5d8500]">Comprar agora</span>
            </Link>
          ))}
        </nav>
        {heroImageUrl && (
          <Link href="/loja" className="relative mt-5 block aspect-[16/5] min-h-[120px] overflow-hidden rounded-2xl bg-[#f3f3f3]">
            <Image src={heroImageUrl} alt="Banner principal da loja" fill priority sizes="100vw" className="object-cover"/>
          </Link>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-[1440px] px-4 sm:px-7 lg:px-10">
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#ddd] bg-white px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produtos" className="w-full bg-transparent text-sm outline-none placeholder:text-[#999]"/>
        </label>
      </div>

      <Section id="ofertas" eyebrow="Black Friday" title="Ofertas Black" description="Confira os modelos selecionados para a campanha." products={(sale.length ? sale : adult).slice(0,5)} href="/loja?ofertas=1"/>
      <Section id="jibbitz-oferta" eyebrow="Oferta especial" title="Compre 8 Jibbitz e Pague 5" description="Escolha seus favoritos e confira as condições da campanha no carrinho." products={jibbitz.slice(0,5)} href="/loja?colecao=469" cta="Ver todos os Jibbitz"/>

      <section className="mx-auto max-w-[1440px] px-4 pb-5 sm:px-7 lg:px-10">
        <div className="rounded-2xl bg-[#84BD00] px-5 py-7 text-[#202020] sm:px-9">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em]">Encontre sua oferta</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Ofertas por faixa de preço</h2>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {prices.map(p => (
              <Link key={p.label} href={`/loja?precoAte=${p.max}&precoDe=${p.min ?? 0}`} className="flex min-h-12 items-center justify-between rounded-lg bg-white px-4 text-sm font-bold transition hover:bg-[#f3f7eb]">
                {p.label}<span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section id="adulto" eyebrow="Coleção" title="Adulto" description="Modelos e cores para diferentes estilos." products={adult.slice(0,5)} href="/loja?colecao=596"/>
      <Section id="infantil" eyebrow="Coleção" title="Infantil" description="Calçados infantis e juvenis." products={kids.slice(0,5)} href="/loja?colecao=597"/>
      <Section id="jibbitz" eyebrow="Coleção" title="Jibbitz e acessórios" description="Charms e detalhes para personalizar seus calçados." products={jibbitz.slice(0,5)} href="/loja?colecao=469"/>

      <div className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-7 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#f5f5f5] p-5"><b className="text-sm">Compra protegida</b><p className="mt-1 text-xs text-[#777]">Consulte as condições de compra e atendimento da loja.</p></div>
          <div className="rounded-xl bg-[#f5f5f5] p-5"><b className="text-sm">Acompanhe seu pedido</b><p className="mt-1 text-xs text-[#777]">Consulte atualizações sobre sua compra.</p></div>
          <div className="rounded-xl bg-[#f5f5f5] p-5"><b className="text-sm">Atendimento</b><p className="mt-1 text-xs text-[#777]">Fale com a equipe responsável pela loja.</p></div>
        </div>
        <p className="mt-5 text-center text-[10px] text-[#777]">Loja independente, sem representação oficial da Crocs. Marcas e imagens pertencem aos respectivos titulares.</p>
      </div>
    </main>
  );
}
