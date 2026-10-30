import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTracker } from "@/components/landing/client";
import ProductBuyBox from "@/components/store/ProductBuyBox";
import { Price } from "@/components/ui/Price";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { CATEGORY_LABEL, FULFILLMENT_LABEL } from "@/lib/domain";
import { siteUrl } from "@/lib/env";
import { getPublicCatalog, getPublicProduct } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublicProduct((await params).slug);
  if (!p) return { title: "Produto não encontrado", robots: { index: false } };
  const settings = await getSettings();
  return {
    title: p.seoTitle || p.name,
    description: p.seoDescription || p.shortDescription || `${p.name} — confira detalhes, disponibilidade e preço.`,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: {
      title: p.seoTitle || p.name,
      description: p.seoDescription || p.shortDescription || undefined,
      images: p.imageUrl ? [p.imageUrl] : undefined,
      siteName: settings.store_name,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const slug = (await params).slug;
  const [p, catalog, settings] = await Promise.all([getPublicProduct(slug), getPublicCatalog(), getSettings()]);
  if (!p) notFound();
  const soldOut = p.stockStatus === "OUT_OF_STOCK" || (p.variants.length > 0 && !p.variants.some((v) => v.available && v.stockQuantity > 0));
  const images = [
    ...(p.imageUrl ? [{ url: p.imageUrl, alt: p.name }] : []),
    ...p.gallery.filter((g) => g.url && g.url !== p.imageUrl),
  ];
  const related = catalog.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
  const baseUrl = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription || p.description || undefined,
    sku: p.sku,
    brand: { "@type": "Brand", name: settings.store_name },
    image: images.map((x) => x.url),
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/produto/${p.slug}`,
      priceCurrency: "BRL",
      price: (p.priceCents / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
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
            {p.videoUrl && <div className="mt-3 overflow-hidden rounded-card"><video src={p.videoUrl} controls playsInline className="aspect-video w-full bg-black" /></div>}
          </div>

          <div>
            <p className="eyebrow text-primary">{CATEGORY_LABEL[p.category]} · {FULFILLMENT_LABEL[p.fulfillment]}</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">{p.name}</h1>
            {p.badge && <span className="chip mt-3 bg-primary text-white">{p.badge}</span>}
            {p.shortDescription && <p className="lead mt-4">{p.shortDescription}</p>}

            {p.promoLabel && <p className="mt-1 text-xs font-bold uppercase text-accent">{p.promoLabel}</p>}
            <ProductBuyBox
              product={{ id: p.id, name: p.name, sku: p.sku, category: p.category, priceCents: p.priceCents, listPriceCents: p.listPriceCents, variants: p.variants }}
              slug={p.slug}
            />

            {p.specs.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-2xl font-extrabold">Detalhes do produto</h2>
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
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{p.description}</p>
              </section>
            )}
            {p.fulfillment !== "PHYSICAL" && p.digitalDeliveryNote && <p className="mt-6 rounded-2xl bg-secondary/20 p-4 text-sm font-semibold">{p.digitalDeliveryNote}</p>}
          </div>
        </div>
      </ViewTracker>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold">Você também pode gostar</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((x, i) => (
              <li key={x.id} className="card flex flex-col overflow-hidden">
                <Link href={`/produto/${x.slug}`}>
                  <ProductVisual imageUrl={x.imageUrl} name={x.name} category={x.category} index={i + 1} className="aspect-square" sizes="25vw" />
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link href={`/produto/${x.slug}`} className="text-sm font-extrabold hover:underline">{x.name}</Link>
                  <div className="mt-auto pt-2"><Price priceCents={x.priceCents} size="sm" /></div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
