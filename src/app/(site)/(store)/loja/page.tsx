import type { Metadata } from "next";
import Link from "next/link";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Price } from "@/components/ui/Price";
import { AddToCartButton, ViewTracker } from "@/components/landing/client";
import { CATEGORY_LABEL } from "@/lib/domain";
import { getPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loja", description: "Kits de Hama Beads, pegboards, pinças, modelos digitais e acessórios.", alternates: { canonical: "/loja" } };

export default async function StorePage() {
  const catalog = await getPublicCatalog();
  const groups = Object.entries(CATEGORY_LABEL)
    .map(([key, label]) => ({ key, label, items: catalog.filter((p) => p.category === key) }))
    .filter((g) => g.items.length);

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow text-primary">Loja</p>
      <h1 className="h-section mt-2">Tudo para criar com Hama Beads</h1>
      {!catalog.length && <p className="lead mt-6">Nenhum produto disponível no momento.</p>}
      {groups.length > 1 && (
        <nav className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4" aria-label="Categorias">
          {groups.map((g) => (
            <a key={g.key} href={`#${g.key.toLowerCase()}`} className="chip min-h-[40px] shrink-0 border-2 border-line bg-surface px-4 text-sm">
              {g.label}
            </a>
          ))}
        </nav>
      )}
      {groups.map((g) => (
        <section key={g.key} id={g.key.toLowerCase()} className="mt-10">
          <h2 className="font-display text-2xl font-extrabold">{g.key === "KIT" ? "Kits" : g.label}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {g.items.map((p, i) => (
              <li key={p.id}>
                <ViewTracker event="product_view" productId={p.id} valueCents={p.priceCents} element="store_grid" className="h-full">
                  <article className="card flex h-full flex-col overflow-hidden">
                    <Link href={`/produto/${p.slug}`} className="block">
                      <ProductVisual imageUrl={p.imageUrl} name={p.name} category={p.category} index={i} className="aspect-square" sizes="(min-width: 1024px) 25vw, 50vw" />
                    </Link>
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      {p.badge && <span className="mb-1 font-pixel text-[10px] uppercase text-primary">{p.badge}</span>}
                      <Link href={`/produto/${p.slug}`} className="font-extrabold leading-tight hover:underline">
                        {p.name}
                      </Link>
                      {p.shortDescription && <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{p.shortDescription}</p>}
                      <div className="mt-auto pt-3">
                        <Price priceCents={p.priceCents} listPriceCents={p.listPriceCents} size="sm" />
                        {p.stockStatus === "OUT_OF_STOCK" ? (
                          <p className="mt-2 text-sm font-bold text-muted">Esgotado</p>
                        ) : (
                          <AddToCartButton product={{ id: p.id, name: p.name, sku: p.sku, priceCents: p.priceCents, category: p.category }} label="Adicionar" element={`store_${p.slug}`} className="mt-2 min-h-[44px] w-full rounded-xl bg-ink text-sm font-bold text-white active:translate-y-px" kitSelect={p.category === "KIT"} />
                        )}
                      </div>
                    </div>
                  </article>
                </ViewTracker>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
