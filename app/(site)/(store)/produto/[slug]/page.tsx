import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTracker } from "@/components/landing/client";
import ProductBuyBox from "@/components/store/ProductBuyBox";
import ProductGallery from "@/components/store/ProductGallery";
import { CampaignTag } from "@/components/store/CampaignTag";
import { Price } from "@/components/ui/Price";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { FULFILLMENT_LABEL } from "@/lib/domain";
import { siteUrl } from "@/lib/env";
import { getPublicCatalog, getPublicProduct } from "@/server/catalog";
import { db } from "@/lib/db";
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
  const reviewStats = await db.review.aggregate({ where: { productId: p.id, approved: true }, _avg: { rating: true }, _count: { _all: true } }).catch(() => null);
  const reviewCount = reviewStats?._count._all ?? 0;
  const averageRating = reviewStats?._avg.rating ?? 0;
  const isBlackFriday = p.homeBlackFriday || p.sourceCollectionIds.some((id) => ["595", "596", "599"].includes(id)) || (p.badge?.toLowerCase().includes("black") ?? false);
  const discountPercent = p.individualDiscountPercent != null && p.individualDiscountPercent > 0 ? Math.round(p.individualDiscountPercent) : p.listPriceCents && p.listPriceCents > p.priceCents ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : null;
  const reviews = reviewCount > 0 ? await db.review.findMany({ where: { productId: p.id, approved: true }, orderBy: [{ featured: "desc" }, { reviewedAt: "desc" }, { createdAt: "desc" }], take: 6, select: { id: true, name: true, text: true, rating: true, reviewedAt: true } }).catch(() => []) : [];
  const soldOut = p.stockStatus === "OUT_OF_STOCK" || (p.variants.length > 0 && !p.variants.some((v) => v.available && v.stockQuantity > 0));
  const images = [
    ...(p.imageUrl ? [{ url: p.imageUrl, alt: p.name }] : []),
    ...p.gallery.filter((g) => g.url && g.url !== p.imageUrl),
  ];
  const related = catalog.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
  const jibbitzProducts = catalog.filter((x) => x.category === "JIBBITZ" && x.stockStatus !== "OUT_OF_STOCK" && (x.variants.length === 0 || x.variants.some((v) => v.available && v.stockQuantity > 0))).slice(0, 10).map((x) => {
    const variant = x.variants.find((v) => v.available && v.stockQuantity > 0);
    return { id: x.id, name: x.name, sku: variant?.sku ?? x.sku, priceCents: variant?.priceCents ?? x.priceCents, imageUrl: x.imageUrl, variantId: variant?.id ?? null };
  });
  const baseUrl = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription || p.description || undefined,
    sku: p.sku,
    brand: { "@type": "Brand", name: p.brandName || settings.store_name },
    image: images.map((x) => x.url),
    ...(reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: averageRating.toFixed(1), reviewCount } } : {}),
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
        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)] lg:gap-7">
          <div>
            {images.length ? (
              <ProductGallery images={images} name={p.name} productId={p.id} />
            ) : (
              <ProductVisual name={p.name} category={p.category} index={p.sortOrder} className="aspect-square rounded-sm" priority />
            )}
            {p.videoUrl && <div className="mt-3 overflow-hidden rounded-card"><video src={p.videoUrl} controls playsInline className="aspect-video w-full bg-black" /></div>}
          </div>

          <div className="min-w-0 rounded-sm border border-[#e5e5e5] bg-white p-4 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d9f00]">{p.brandName || "Crocs"} · {FULFILLMENT_LABEL[p.fulfillment]}</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#111] sm:text-4xl">{p.name}</h1>
            {reviewCount > 0 && <div className="mt-2 flex items-center gap-2 text-sm" aria-label={`Avaliação média ${averageRating.toFixed(1)} de 5 com ${reviewCount} avaliações`}><span className="tracking-[2px] text-[#f0ad00]" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => index < Math.round(averageRating) ? "★" : "☆").join("")}</span><span className="text-[#666]">({reviewCount})</span><a href="#avaliacoes" className="text-xs font-semibold text-[#555] underline underline-offset-2">Ver avaliações</a></div>}
            {isBlackFriday && <div className="mt-3"><CampaignTag discountPercent={discountPercent} /></div>}
            {p.shortDescription && <p className="lead mt-4">{p.shortDescription}</p>}

            {p.promoLabel && <p className="mt-1 text-xs font-bold uppercase text-accent">{p.promoLabel}</p>}
            <ProductBuyBox
              product={{ id: p.id, name: p.name, sku: p.sku, category: p.category, priceCents: p.priceCents, listPriceCents: p.listPriceCents, variants: p.variants, stockStatus: p.stockStatus, colorFamily: p.colorFamily }}
              slug={p.slug}
              jibbitzProducts={jibbitzProducts}
              productJibbitzTitle={settings.product_jibbitz_title}
              productJibbitzDescription={settings.product_jibbitz_description}
              productResellerNote={settings.reseller_notice_product}
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

      {reviews.length > 0 && (
        <section id="avaliacoes" className="mt-14 border-t border-[#e8e8e8] pt-9">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-[#222]">Avaliações de clientes</h2>
              <p className="mt-1 text-sm text-[#666]">Opiniões publicadas e aprovadas pela equipe da loja.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#222]">{averageRating.toFixed(1)} <span className="text-[#f0ad00]">★</span></p>
              <p className="text-xs text-[#666]">{reviewCount} avaliação(ões)</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="border border-[#e8e8e8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-[#222]">{review.name}</p>
                  <span className="text-sm tracking-[2px] text-[#f0ad00]" aria-label={`${review.rating} de 5 estrelas`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#555]">{review.text}</p>
                {review.reviewedAt && <p className="mt-3 text-[11px] text-[#888]">{review.reviewedAt.toLocaleDateString("pt-BR")}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

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
