"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Price } from "@/components/ui/Price";
import { ViewTracker } from "@/components/landing/client";
import { CATEGORY_LABEL } from "@/lib/domain";
import type { PublicProduct } from "@/types/catalog";
import { FavoriteButton, FAVORITES_STORAGE_KEY } from "@/components/store/FavoriteButton";
import { CampaignTag } from "@/components/store/CampaignTag";
import { QuickAddButton } from "@/components/store/QuickAddButton";
import { crocsColorBackground } from "@/lib/crocs-colors";
import { deduplicateCatalogColorways, filterCatalogByCollection } from "@/lib/catalog-display";

type SortMode = "featured" | "price_asc" | "price_desc" | "name";
const PAGE_SIZE = 20;

function isBlackFriday(product: PublicProduct) {
  return product.homeBlackFriday ||
    product.sourceCollectionIds.some((id) => ["595", "596", "599"].includes(id)) ||
    (product.badge?.toLowerCase().includes("black") ?? false);
}
function discountPercent(product: PublicProduct) {
  if (product.individualDiscountPercent != null && product.individualDiscountPercent > 0) {
    return Math.round(product.individualDiscountPercent);
  }
  if (product.listPriceCents && product.listPriceCents > product.priceCents) {
    return Math.round((1 - product.priceCents / product.listPriceCents) * 100);
  }
  return null;
}
function productColors(product: PublicProduct) {
  return product.category === "JIBBITZ" ? [] : product.colorFamily;
}

export default function FootwearCatalog({
  products,
  initialCollection = "ALL",
  initialDeals = false,
  minPrice = 0,
  maxPrice = 0,
  initialQuery = "",
  initialCategory = "ALL",
  initialFavoritesOnly = false,
  initialSort = "featured",
  initialPage = 1,
}: {
  products: PublicProduct[];
  initialCollection?: string;
  initialDeals?: boolean;
  minPrice?: number;
  maxPrice?: number;
  initialQuery?: string;
  initialCategory?: string;
  initialFavoritesOnly?: boolean;
  initialSort?: string;
  initialPage?: number;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [onlyFavorites, setOnlyFavorites] = useState(initialFavoritesOnly);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>(["featured", "price_asc", "price_desc", "name"].includes(initialSort) ? initialSort as SortMode : "featured");
  const [onlyDeals, setOnlyDeals] = useState(initialDeals);
  const [collection, setCollection] = useState(initialCollection);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const router = useRouter();
  const pathname = usePathname();
  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (!value) params.delete(key);
    else params.set(key, value);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const syncFavorites = () => {
      try {
        const raw: unknown = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
        setFavoriteIds(Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : []);
      } catch {
        setFavoriteIds([]);
      }
    };
    syncFavorites();
    window.addEventListener("footwear:favorites-updated", syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener("footwear:favorites-updated", syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    const filtered = products
      .filter((product) => category === "ALL" || product.category === category)
      .filter((product) => minPrice <= 0 || product.priceCents >= minPrice)
      .filter((product) => maxPrice <= 0 || product.priceCents <= maxPrice)
      .filter((product) => !onlyDeals || (product.listPriceCents != null && product.listPriceCents > product.priceCents))
      .filter((product) => !onlyFavorites || favoriteIds.includes(product.id))
      .filter((product) => !needle || `${product.name} ${product.shortDescription ?? ""} ${product.brandName ?? "Crocs"} ${CATEGORY_LABEL[product.category]}`
        .toLocaleLowerCase("pt-BR").includes(needle));
    const inCollection = filterCatalogByCollection(filtered, collection);
    const sorted = [...inCollection].sort((a, b) => {
      if (sort === "price_asc") return a.priceCents - b.priceCents;
      if (sort === "price_desc") return b.priceCents - a.priceCents;
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR");
    });
    return deduplicateCatalogColorways(sorted);
  }, [products, query, category, collection, sort, onlyDeals, onlyFavorites, favoriteIds, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + index;
  });

  const changePage = (next: number) => {
    const targetPage = Math.min(totalPages, Math.max(1, next));
    setPage(targetPage);
    updateUrlParam("pagina", targetPage > 1 ? String(targetPage) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("ALL");
    setCollection("ALL");
    setSort("featured");
    setOnlyDeals(false);
    setOnlyFavorites(false);
    setPage(1);
    router.replace("/loja", { scroll: false });
  };

  const collectionLabel: Record<string, string> = {
    "111": "Feminino",
    "146": "Masculino",
    "173": "Kids",
    "215": "Jibbitz",
    "225": "Crocs At Work",
    "1792513037": "Bolsas e Acessórios",
    "111,146": "Adulto",
    "595,596,599": "Black Friday",
  };
  const title = onlyFavorites ? "Meus favoritos" : collectionLabel[collection] || (initialDeals ? "Ofertas Black Friday" : "Todos os produtos");

  return (
    <div className="container-page py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#777]">
        <Link href="/" className="hover:underline">Início</Link> / <span className="text-[#222]">{title}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#659900]">Catálogo Crocs</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#111]">{title}</h1>
          <p className="mt-2 text-sm text-[#666]">
            {onlyFavorites ? "Os produtos que você marcou para rever depois." : "Modelos, cores e tamanhos disponíveis nesta loja independente."}
          </p>
        </div>
        <p className="text-xs text-[#777]">{visible.length.toLocaleString("pt-BR")} produto(s) · {PAGE_SIZE} por página</p>
      </div>

      <section aria-label="Filtros de produtos" className="mt-5 border-y border-[#e5e5e5] py-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Buscar</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              onBlur={() => updateUrlParam("q", query)}
              onKeyDown={(event) => { if (event.key === "Enter") updateUrlParam("q", query); }}
              placeholder="Nome, modelo ou descrição"
              className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm outline-none focus:border-[#8abd00]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Categoria</span>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); updateUrlParam("categoria", event.target.value === "ALL" ? "" : event.target.value); }}
              className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm">
              <option value="ALL">Todas as categorias</option>
              {categories.map((key) => <option key={key} value={key}>{CATEGORY_LABEL[key]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Coleção</span>
            <select value={collection} onChange={(event) => { setCollection(event.target.value); setPage(1); updateUrlParam("colecao", event.target.value === "ALL" ? "" : event.target.value); }}
              className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm">
              <option value="ALL">Todas</option>
              <option value="111,146">Adulto</option>
              <option value="111">Feminino</option>
              <option value="146">Masculino</option>
              <option value="173">Kids</option>
              <option value="215">Jibbitz</option>
              <option value="225">Crocs At Work</option>
              <option value="1792513037">Bolsas e Acessórios</option>
              <option value="595,596,599">Black Friday</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">Ordenar por</span>
            <select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setPage(1); updateUrlParam("ordem", event.target.value === "featured" ? "" : event.target.value); }}
              className="min-h-11 w-full border border-[#ddd] bg-white px-3 text-sm">
              <option value="featured">Mais vendidos</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#333]">
            <input type="checkbox" checked={onlyDeals} onChange={(event) => { setOnlyDeals(event.target.checked); setPage(1); updateUrlParam("ofertas", event.target.checked ? "1" : ""); }} className="h-4 w-4 accent-[#84BD00]" />
            Mostrar somente produtos em oferta
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#333]">
            <input type="checkbox" checked={onlyFavorites} onChange={(event) => { setOnlyFavorites(event.target.checked); setPage(1); updateUrlParam("favoritos", event.target.checked ? "1" : ""); }} className="h-4 w-4 accent-[#84BD00]" />
            Somente favoritos
          </label>
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#555] underline underline-offset-2">Limpar filtros</button>
        </div>
      </section>

      {pageProducts.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#ddd] px-5 py-12 text-center">
          <p className="font-bold">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-[#777]">Tente alterar os filtros ou a busca.</p>
          <button type="button" onClick={clearFilters} className="mt-4 min-h-10 border border-[#ddd] px-5 text-sm font-bold">Limpar filtros</button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-5">
          {pageProducts.map((product, index) => {
            const discount = discountPercent(product);
            const colors = productColors(product);
            const blackFriday = isBlackFriday(product);
            return (
              <li key={product.id}>
                <ViewTracker event="product_view" productId={product.id} valueCents={product.priceCents} element="footwear_catalog" className="h-full">
                  <article className="group flex h-full flex-col bg-white">
                    <div className="relative">
                      <Link href={`/produto/${product.slug}`} className="relative block overflow-hidden rounded-[10px] border border-[#f0f0f0] bg-[#f7f6f2]">
                        <ProductVisual imageUrl={product.imageUrl} name={product.name} category={product.category} index={index}
                          className="aspect-square" sizes="(min-width:1280px) 20vw,50vw" />
                        {blackFriday && <span className="absolute bottom-2 left-2"><CampaignTag discountPercent={discount} /></span>}
                        {!blackFriday && product.badge && <span className="absolute bottom-2 left-2 rounded-full bg-[#ededed] px-2.5 py-1 text-[9px] font-bold text-[#222]">{product.badge}</span>}
                      </Link>
                      <FavoriteButton productId={product.id} className="absolute left-3 top-3" />
                    </div>
                    <div className="flex flex-1 flex-col pt-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#777]">{product.brandName || "Crocs"}</p>
                      <Link href={`/produto/${product.slug}`} className="mt-1 min-h-10 text-sm font-bold leading-5 text-[#171717] hover:underline">{product.name}</Link>
                      {product.category === "JIBBITZ" ? (
                        <p className="mt-2 min-h-5 text-[10px] font-semibold uppercase tracking-wide text-[#777]">Personagens e temas</p>
                      ) : colors.length > 0 ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`${colors.length} cores oficiais disponíveis`}>
                          {colors.map((color) => (
                            <Link key={color.id} href={`/produto/${color.slug}`} title={color.value} aria-label={`Cor ${color.value}`}
                              className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-black/15 bg-white">
                              <span className="h-3 w-3 rounded-full" style={{ background: crocsColorBackground(color.value) }} />
                            </Link>
                          ))}
                        </div>
                      ) : <div className="mt-2 min-h-5" />}
                      <div className="mt-auto pt-3">
                        <Price priceCents={product.priceCents} listPriceCents={product.listPriceCents} size="sm"
                          className="flex-col items-start gap-0 [&>span:first-child]:text-sm [&>span:last-child]:text-[#4f9825]" />
                      </div>
                      <QuickAddButton product={product} className="mt-3" />
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
          <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}
            className="min-h-10 border border-[#ddd] px-4 text-sm font-semibold disabled:opacity-35">Anterior</button>
          {pageNumbers.map((number) => (
            <button key={number} type="button" onClick={() => changePage(number)} aria-current={currentPage === number ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center border px-3 text-sm font-bold ${currentPage === number ? "border-[#222] bg-[#222] text-white" : "border-[#ddd] bg-white text-[#333]"}`}>
              {number}
            </button>
          ))}
          <button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}
            className="min-h-10 border border-[#ddd] px-4 text-sm font-semibold disabled:opacity-35">Próxima</button>
        </nav>
      )}
    </div>
  );
}
