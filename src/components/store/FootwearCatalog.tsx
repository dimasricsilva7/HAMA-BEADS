"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Price } from "@/components/ui/Price";
import { AddToCartButton, ViewTracker } from "@/components/landing/client";
import { CATEGORY_LABEL } from "@/lib/domain";
import type { PublicProduct } from "@/types/catalog";

type SortMode = "featured" | "price_asc" | "price_desc" | "name";

export default function FootwearCatalog({ products }: { products: PublicProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<SortMode>("featured");
  const [onlyDeals, setOnlyDeals] = useState(false);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return products
      .filter((p) => category === "ALL" || p.category === category)
      .filter((p) => !onlyDeals || (p.listPriceCents != null && p.listPriceCents > p.priceCents))
      .filter((p) => !needle || `${p.name} ${p.shortDescription ?? ""} ${CATEGORY_LABEL[p.category]}`.toLocaleLowerCase("pt-BR").includes(needle))
      .sort((a, b) => {
        if (sort === "price_asc") return a.priceCents - b.priceCents;
        if (sort === "price_desc") return b.priceCents - a.priceCents;
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
        return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR");
      });
  }, [products, query, category, sort, onlyDeals]);

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted"><Link href="/" className="hover:underline">Início</Link> / <span className="text-ink">Todos os produtos</span></nav>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow text-primary">Explore a coleção</p><h1 className="h-section mt-1">Todos os produtos</h1><p className="mt-2 text-sm text-muted">Encontre o modelo certo para acompanhar sua rotina.</p></div>
        <p className="text-xs text-muted">{visible.length} produto(s) encontrado(s)</p>
      </div>

      <section aria-label="Filtros de produtos" className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <label className="block">
            <span className="label">Buscar</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, modelo ou descrição" className="input" />
          </label>
          <label className="block">
            <span className="label">Categoria</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="ALL">Todas as categorias</option>
              {categories.map((key) => <option key={key} value={key}>{CATEGORY_LABEL[key]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="input">
              <option value="featured">Destaques</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome</option>
            </select>
          </label>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={onlyDeals} onChange={(e) => setOnlyDeals(e.target.checked)} className="h-4 w-4 rounded border-line" />
          Mostrar somente produtos em oferta
        </label>
      </section>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface px-5 py-12 text-center">
          <p className="font-bold">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-muted">Tente alterar os filtros ou a busca.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("ALL"); setSort("featured"); setOnlyDeals(false); }} className="btn-secondary mt-4">Limpar filtros</button>
        </div>
      ) : (
        <ul className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {visible.map((p, i) => {
            const discount = p.listPriceCents && p.listPriceCents > p.priceCents ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : null;
            return (
              <li key={p.id}>
                <ViewTracker event="product_view" productId={p.id} valueCents={p.priceCents} element="footwear_catalog" className="h-full">
                  <article className="card flex h-full flex-col overflow-hidden">
                    <Link href={`/produto/${p.slug}`} className="relative block">
                      <ProductVisual imageUrl={p.imageUrl} name={p.name} category={p.category} index={i} className="aspect-square" sizes="(min-width: 1024px) 25vw, 50vw" />
                      {discount != null && <span className="absolute right-2 top-2 rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold text-white">-{discount}%</span>}
                      {p.badge && <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-white">{p.badge}</span>}
                    </Link>
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{CATEGORY_LABEL[p.category]}</p>
                      <Link href={`/produto/${p.slug}`} className="mt-1 min-h-10 font-bold leading-tight hover:underline">{p.name}</Link>
                      {p.shortDescription && <p className="mt-1 line-clamp-2 text-xs text-muted">{p.shortDescription}</p>}
                      <div className="mt-auto pt-3"><Price priceCents={p.priceCents} listPriceCents={p.listPriceCents} size="sm"/>{p.variants.length > 0 ? <Link href={`/produto/${p.slug}`} className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">Escolher tamanho/cor</Link> : <AddToCartButton product={{id:p.id,name:p.name,sku:p.sku,priceCents:p.priceCents,category:p.category}} label="Adicionar" element={`catalog_${p.slug}`} className="mt-3 min-h-[44px] w-full rounded-xl bg-ink text-sm font-bold text-white"/>}</div>
                    </div>
                  </article>
                </ViewTracker>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
