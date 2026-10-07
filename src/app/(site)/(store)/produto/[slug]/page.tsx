import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Price } from "@/components/ui/Price";
import { PixelIcon } from "@/components/ui/PixelArt";
import { RichText } from "@/components/ui/RichText";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { AddToCartButton, ViewTracker } from "@/components/landing/client";
import { COMPONENT_ICON } from "@/components/landing/Commerce";
import { CATEGORY_LABEL, FULFILLMENT_LABEL } from "@/lib/domain";
import { siteUrl } from "@/lib/env";
import { getPublicCatalog, getPublicProduct } from "@/server/catalog";
import { getApprovedReviews } from "@/server/landing";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublicProduct((await params).slug);
  if (!p) return { title: "Produto não encontrado", robots: { index: false } };
  const title = p.seoTitle || p.name;
  const description = p.seoDescription || p.shortDescription || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title, description, type: "website", ...(p.imageUrl ? { images: [p.imageUrl] } : {}) },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [p, catalog, reviews, settings] = await Promise.all([getPublicProduct(slug), getPublicCatalog(), getApprovedReviews().catch(() => []), getSettings()]);
  if (!p) notFound();
  const images = [...(p.imageUrl ? [{ url: p.imageUrl, alt: p.name }] : []), ...p.gallery];
  const cross = p.crossSellIds.map((id) => catalog.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => Boolean(x)).slice(0, 4);
  const productReviews = reviews.filter((r) => r.productId === p.id);
  const ref = { id: p.id, name: p.name, sku: p.sku, priceCents: p.priceCents, category: p.category };
  const soldOut = p.stockStatus === "OUT_OF_STOCK";
  const nf = new Intl.NumberFormat("pt-BR");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription ?? undefined,
    sku: p.sku,
    brand: { "@type": "Brand", name: settings.store_name },
    ...(images.length ? { image: images.map((i) => i.url) } : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/produto/${p.slug}`,
      priceCurrency: "BRL",
      price: (p.priceCents / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/OutOfStock" : p.stockStatus === "PREORDER" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="text-sm text-muted" aria-label="Trilha">
        <Link href="/" className="hover:underline">Início</Link> / <Link href="/loja" className="hover:underline">Loja</Link> / <span className="text-ink">{p.name}</span>
      </nav>
      <ViewTracker event="product_view" productId={p.id} valueCents={p.priceCents} element="product_page" meta={{ sku: p.sku, name: p.name, priceCents: p.priceCents, category: p.category }}>
        <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            {images.length ? (
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-card bg-surface shadow-soft">
                  <Image src={images[0].url} alt={images[0].alt || p.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
                {images.length > 1 && (
                  <ul className="no-scrollbar flex gap-2 overflow-x-auto">
                    {images.slice(1).map((img) => (
                      <li key={img.url} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl">
                        <Image src={img.url} alt={img.alt || p.name} fill sizes="96px" className="object-cover" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <ProductVisual name={p.name} category={p.category} index={p.sortOrder} className="aspect-square rounded-card" priority />
            )}
            {p.videoUrl && <VideoEmbed url={p.videoUrl} title={`Vídeo: ${p.name}`} className="mt-3 rounded-card" />}
          </div>

          <div>
            <p className="eyebrow text-primary">{CATEGORY_LABEL[p.category]} · {FULFILLMENT_LABEL[p.fulfillment]}</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">{p.name}</h1>
            {p.badge && <span className="chip mt-3 bg-primary text-white">{p.badge}</span>}
            {p.shortDescription && <p className="lead mt-4">{p.shortDescription}</p>}

            <dl className="mt-5 flex flex-wrap gap-2">
              {[
                [p.beadCount, "peças"],
                [p.colorCount, "cores"],
                [p.pegboardCount, p.pegboardCount === 1 ? "pegboard" : "pegboards"],
                [p.modelCount, "modelos"],
              ]
                .filter(([v]) => v != null)
                .map(([v, l]) => (
                  <div key={String(l)} className="rounded-2xl border border-line bg-surface px-4 py-2">
                    <dt className="sr-only">{l}</dt>
                    <dd>
                      <b className="font-display text-xl">{nf.format(Number(v))}</b> <span className="text-sm text-muted">{l}</span>
                    </dd>
                  </div>
                ))}
            </dl>

            <div className="mt-6 rounded-card border border-line bg-surface p-5 shadow-soft">
              {p.promoLabel && <p className="mb-1 text-xs font-bold uppercase text-accent">{p.promoLabel}</p>}
              <Price priceCents={p.priceCents} listPriceCents={p.listPriceCents} size="lg" />
              <p className="text-sm text-muted">Pagamento via PIX</p>
              {soldOut ? (
                <p className="mt-4 rounded-xl bg-ink/5 py-3 text-center font-bold">Esgotado no momento</p>
              ) : (
                <AddToCartButton product={ref} label={p.category === "KIT" ? "Quero este kit" : "Adicionar ao carrinho"} element={`pdp_${p.slug}`} className="btn-primary mt-4 w-full" kitSelect={p.category === "KIT"} />
              )}
            </div>

            {p.components.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-2xl font-extrabold">O que vem {p.category === "KIT" ? "no kit" : "no produto"}</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {p.components.map((c) => {
                    const bonus = c.isBonus || c.type === "bonus";
                    return (
                      <li key={c.id} className={`flex items-center gap-3 rounded-2xl p-3 ${bonus ? "bg-accent/10" : "bg-surface ring-1 ring-line"}`}>
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${bonus ? "bg-accent text-white" : "bg-primary/10 text-primary"}`}>
                          <PixelIcon name={COMPONENT_ICON[c.type] ?? "star"} className="h-5 w-5" />
                        </span>
                        <span className="text-sm">
                          <b>{c.quantity && !c.label.startsWith(c.quantity) ? `${c.quantity}× ` : ""}{c.label}</b>
                          {bonus && <span className="ml-1 font-bold text-accent">bônus</span>}
                          {c.detail && <span className="block text-muted">{c.detail}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {p.specs.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-2xl font-extrabold">Especificações</h2>
                <dl className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
                  {p.specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted">{s.label}</dt>
                      <dd className="text-right font-semibold">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {p.description && (
              <section className="mt-8">
                <h2 className="font-display text-2xl font-extrabold">Descrição</h2>
                <RichText text={p.description} className="mt-3 leading-relaxed text-muted" />
              </section>
            )}
            {p.fulfillment !== "PHYSICAL" && p.digitalDeliveryNote && (
              <p className="mt-6 flex gap-2 rounded-2xl bg-secondary/20 p-4 text-sm font-semibold">
                <PixelIcon name="download" className="h-5 w-5 shrink-0" /> {p.digitalDeliveryNote}
              </p>
            )}
            {p.category === "KIT" && (
              <p className="mt-6 text-xs leading-relaxed text-muted">Siga sempre as instruções de uso. A ferramenta de fusão esquenta: mantenha longe de crianças sem a supervisão de um adulto.</p>
            )}
          </div>
        </div>
      </ViewTracker>

      {cross.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold">Combina com este {p.category === "KIT" ? "kit" : "produto"}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cross.map((c, i) => (
              <li key={c.id} className="card flex flex-col overflow-hidden">
                <ProductVisual imageUrl={c.imageUrl} name={c.name} category={c.category} index={i + 1} className="aspect-square" sizes="25vw" />
                <div className="flex flex-1 flex-col p-3">
                  <Link href={`/produto/${c.slug}`} className="text-sm font-extrabold hover:underline">{c.name}</Link>
                  <div className="mt-auto pt-2">
                    <Price priceCents={c.priceCents} size="sm" />
                    <AddToCartButton product={{ id: c.id, name: c.name, sku: c.sku, priceCents: c.priceCents, category: c.category }} label="+ Adicionar" element={`pdp_cross_${c.slug}`} source="cross_sell" className="mt-2 min-h-[44px] w-full rounded-xl bg-ink text-sm font-bold text-white" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {productReviews.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold">Avaliações</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {productReviews.map((r) => (
              <li key={r.id} className="card p-5">
                <p className="text-secondary" aria-label={`${r.rating} de 5`}>{"★".repeat(r.rating)}</p>
                <p className="mt-2">“{r.text}”</p>
                <p className="mt-3 text-sm font-bold">{r.name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
