"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Price } from "@/components/ui/Price";
import { ViewTracker } from "@/components/landing/client";
import { CATEGORY_LABEL } from "@/lib/domain";
import type { PublicProduct } from "@/types/catalog";

type SortMode = "featured" | "price_asc" | "price_desc" | "name";
const PAGE_SIZE = 20;
const colorMap: [RegExp, string][] = [
  [/white|branco|off white|cream|ivory/, "#f7f4e9"], [/black|preto/, "#171717"],
  [/blue|azul|navy|teal/, "#2874b8"], [/pink|rosa/, "#e88da9"], [/red|vermelho/, "#c33a42"],
  [/green|verde|olive/, "#6a8d43"], [/yellow|amarelo|gold/, "#e6c64f"],
  [/purple|roxo|lilac|lavender/, "#9b80b9"], [/brown|marrom/, "#8c5a3c"],
  [/grey|gray|cinza|slate/, "#888b8e"], [/beige|bege|sand|areia|khaki/, "#c8b994"],
];
function colorHex(value: string) {
  const name = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return colorMap.find(([pattern]) => pattern.test(name))?.[1] ?? "#c8c8c8";
}
function productColors(product: PublicProduct) {
  return [...new Set(product.variants.flatMap((variant) => variant.options
    .filter((option) => /^(cor|color|colour)$/i.test(option.name))
    .map((option) => option.value)))];
}

export default function FootwearCatalog({ products, initialCollection = "ALL", initialDeals = false, minPrice = 0, maxPrice = 0 }: {
  products: PublicProduct[];
  initialCollection?: string;
  initialDeals?: boolean;
  minPrice?: number;
  maxPrice?: number;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<SortMode>("featured");
  const [onlyDeals, setOnlyDeals] = useState(initialDeals);
  const [collection, setCollection] = useState(initialCollection);
  const [page, setPage] = useState(1);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return products
      .filter((p) => category === "ALL" || p.category === category)
      .filter((p) => collection === "ALL" || p.sourceCollectionId === collection)
      .filter((p) => minPrice <= 0 || p.priceCents >= minPrice)
      .filter((p) => maxPrice <= 0 || p.priceCents <= maxPrice)
      .filter((p) => !onlyDeals || (p.listPriceCents != null && p.listPriceCents > p.priceCents))
      .filter((p) => !needle || `${p.name} ${p.shortDescription ?? ""} ${p.brandName ?? "Crocs"} ${CATEGORY_LABEL[p.category]}`.toLocaleLowerCase("pt-BR").includes(needle))
      .sort((a, b) => {
        if (sort === "price_asc") return a.priceCents - b.priceCents;
        if (sort === "price_desc") return b.priceCents - a.priceCents;
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
        return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR");
      });
  }, [products, query, category, collection, sort, onlyDeals, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + index;
  });
  const changePage = (next: number) => {
    setPage(Math.min(totalPages, Math.max(1, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#777]"><Link href="/" className="hover:underline">Início</Link> / <span className="text-[#222]">Todos os produtos</span></nav>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#659900]">Coleção Crocs</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#111]">Todos os produtos</h1>
          <p className="mt-2 text-sm text-[#666]">Modelos, cores e tamanhos disponíveis nesta loja independente.</p>
        </div>
        <p className="text-xs text-[#777]">{visible.length.toLocaleString("pt-BR")} produto(s) · 20 por página</p>
      </div>

      <section aria-label="Filtros de produtos" className="mt-5 border-y border-[#e5e5e5] py-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Buscar</span>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Nome, modelo ou descrição" className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm outline-none focus:border-[#8abd00]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Categoria</span>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm">
              <option value="ALL">Todas as categorias</option>
              {categories.map((key) => <option key={key} value={key}>{CATEGORY_LABEL[key]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Coleção</span>
            <select value={collection} onChange={(e) => { setCollection(e.target.value); setPage(1); }} className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm">
              <option value="ALL">Todas</option><option value="596">Adulto</option><option value="597">Infantil</option><option value="469">Jibbitz</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Ordenar por</span>
            <select value={sort} onChange={(e) => { setSort(e.target.value as SortMode); setPage(1); }} className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm">
              <option value="featured">Destaques</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option><option value="name">Nome</option>
            </select>
          </label>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#333]">
          <input type="checkbox" checked={onlyDeals} onChange={(e) => { setOnlyDeals(e.target.checked); setPage(1); }} className="h-4 w-4 accent-[#84BD00]" />
          Mostrar somente produtos em oferta
        </label>
      </section>

      {pageProducts.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#ddd] px-5 py-12 text-center">
          <p className="font-bold">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-[#777]">Tente alterar os filtros ou a busca.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("ALL"); setCollection("ALL"); setSort("featured"); setOnlyDeals(false); setPage(1); }} className="mt-4 min-h-10 border border-[#ddd] px-5 text-sm font-bold">Limpar filtros</button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-5">
          {pageProducts.map((p, index) => {
            const discount = p.listPriceCents && p.listPriceCents > p.priceCents ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : null;
            const colors = productColors(p);
            return (
              <li key={p.id}>
                <ViewTracker event="product_view" productId={p.id} valueCents={p.priceCents} element="footwear_catalog" className="h-full">
                  <article className="group flex h-full flex-col bg-white">
                    <Link href={`/produto/${p.slug}`} className="relative block border border-[#f0f0f0] bg-[#f7f6f2]">
                      <ProductVisual imageUrl={p.imageUrl} name={p.name} category={p.category} index={index} className="aspect-square" sizes="(min-width: 1280px) 20vw, 50vw" />
                      {p.badge && <span className="absolute left-2 top-2 bg-[#b51e53] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">{p.badge}</span>}
                      {discount != null && <span className="absolute right-2 top-2 border border-[#6ea900] bg-white px-2 py-1 text-[10px] font-extrabold text-[#5f9400]">-{discount}%</span>}
                    </Link>
                    <div className="flex flex-1 flex-col pt-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#777]">{p.brandName || "Crocs"}</p>
                      <Link href={`/produto/${p.slug}`} className="mt-1 min-h-10 text-sm font-bold leading-5 text-[#171717] hover:underline">{p.name}</Link>
                      {colors.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5" aria-label={`${colors.length} cores disponíveis`}>
                          {colors.slice(0, 7).map((color) => <span key={color} title={color} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: colorHex(color) }} />)}
                          {colors.length > 7 && <span className="text-[10px] font-semibold text-[#777]">+{colors.length - 7}</span>}
                        </div>
                      )}
                      <div className="mt-auto pt-3"><Price priceCents={p.priceCents} listPriceCents={p.listPriceCents} size="sm" /></div>
                      <Link href={`/produto/${p.slug}`} className="mt-3 flex min-h-10 w-full items-center justify-center bg-[#222] px-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#84BD00] hover:text-[#172000]">Escolher tamanho/cor</Link>
                    </div>
                  </article>
                </ViewTracker>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação do catálogo" className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-[#e6e6e6] pt-6">
          <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} className="min-h-10 border border-[#ddd] px-4 text-sm font-semibold disabled:opacity-35">Anterior</button>
          {pageNumbers.map((number) => <button key={number} type="button" aria-current={currentPage === number ? "page" : undefined} onClick={() => changePage(number)} className={`h-10 min-w-10 border px-3 text-sm font-bold ${currentPage === number ? "border-[#222] bg-[#222] text-white" : "border-[#ddd] bg-white text-[#333]"}`}>{number}</button>)}
          <button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} className="min-h-10 border border-[#ddd] px-4 text-sm font-semibold disabled:opacity-35">Próxima</button>
          <span className="w-full text-center text-xs text-[#777]">Página {currentPage} de {totalPages}</span>
        </nav>
      )}
    </div>
  );
}
