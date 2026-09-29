import { Fragment } from "react";
import { Hero } from "@/components/landing/Hero";
import { Audience, Benefits, FinalCta, HowItWorks, ModelsIncluded, ProductInUse, Reviews, Trust } from "@/components/landing/Sections";
import { CompleteKit, DigitalLibrary, KitSelector, OfferSection } from "@/components/landing/Commerce";
import { Gallery, Inspiration } from "@/components/landing/Gallery";
import { VideoSection } from "@/components/landing/VideoSection";
import { Faq } from "@/components/landing/Faq";
import { LandingTracker, StickyMobileCTA } from "@/components/landing/client";
import { valueFor } from "@/lib/experiments";
import { siteUrl } from "@/lib/env";
import { currentAssignments, getPublicCatalog } from "@/server/catalog";
import { cfgArr, cfgStr, getApprovedReviews, getFaqs, getGallery, getLandingSections, type SectionData } from "@/server/landing";
import { getSettings, isOn } from "@/server/settings";

export const dynamic = "force-dynamic";

function orderSections(sections: SectionData[], override: string | null) {
  if (!override) return sections;
  const order = override.split(",").map((s) => s.trim());
  const rank = (k: string) => (order.includes(k) ? order.indexOf(k) : order.length + sections.findIndex((s) => s.key === k));
  return [...sections].sort((a, b) => rank(a.key) - rank(b.key));
}

export default async function LandingPage() {
  const assignments = await currentAssignments();
  const [sectionsRaw, catalog, gallery, faqs, reviews, settings] = await Promise.all([
    getLandingSections(),
    getPublicCatalog(assignments),
    getGallery(),
    getFaqs(),
    getApprovedReviews(),
    getSettings(),
  ]);

  const sections = orderSections(sectionsRaw.filter((s) => s.active), valueFor(assignments, "section_order"));
  const sellable = catalog.filter((p) => p.stockStatus !== "OUT_OF_STOCK" || p.category === "KIT");
  const kits = catalog.filter((p) => p.category === "KIT");
  const byId = (id: string) => catalog.find((p) => p.id === id) ?? null;
  const highlightId = valueFor(assignments, "featured_kit") ?? kits.find((k) => k.featured)?.id ?? null;
  const librarySection = sections.find((s) => s.type === "library");
  const libraryId = librarySection ? cfgStr(librarySection.config, "productId") : "";
  const galleryCards = gallery.map((g) => ({ id: g.id, title: g.title, category: g.category, imageUrl: g.imageUrl, alt: g.alt }));
  const audiences = sections.filter((s) => s.type === "audience");
  let audienceRendered = false;

  const render = (s: SectionData) => {
    switch (s.type) {
      case "hero": {
        const featured = kits.find((k) => k.id === highlightId);
        return (
          <Hero
            section={s}
            headline={valueFor(assignments, "hero_headline") ?? s.title ?? ""}
            ctaLabel={valueFor(assignments, "hero_cta") ?? s.ctaLabel ?? "QUERO MEU KIT"}
            imageUrl={valueFor(assignments, "hero_image") ?? s.imageUrl ?? featured?.imageUrl ?? null}
          />
        );
      }
      case "product_in_use":
        return <ProductInUse section={s} />;
      case "video":
        return s.videoUrl ? <VideoSection title={s.title} subtitle={s.subtitle} mobileUrl={s.videoUrl} desktopUrl={cfgStr(s.config, "desktopVideoUrl") || null} posterUrl={cfgStr(s.config, "posterUrl") || s.imageUrl} /> : null;
      case "benefits":
        return <Benefits section={s} />;
      case "how_it_works":
        return <HowItWorks section={s} />;
      case "gallery":
        return <Gallery title={s.title} subtitle={s.subtitle} items={galleryCards} />;
      case "inspiration":
        return <Inspiration title={s.title} subtitle={s.subtitle} ctaLabel={s.ctaLabel || "Quero criar algo assim"} ctaTarget={s.ctaTarget || "#kits"} items={galleryCards.filter((g) => gallery.find((x) => x.id === g.id)?.inspiration)} />;
      case "audience":
        if (audienceRendered) return null;
        audienceRendered = true;
        return <Audience sections={audiences} />;
      case "kits":
        return <KitSelector section={s} kits={kits} highlightId={highlightId} />;
      case "offer":
        return <OfferSection section={s} product={byId(cfgStr(s.config, "productId")) ?? kits.find((k) => k.id === highlightId) ?? null} />;
      case "models_included":
        return <ModelsIncluded section={s} />;
      case "complete_kit": {
        const ids = cfgArr<string>(s.config, "productIds");
        const list = ids.length ? ids.map(byId).filter((p): p is NonNullable<typeof p> => Boolean(p)) : sellable.filter((p) => p.category !== "KIT" && p.id !== libraryId);
        return <CompleteKit section={s} products={list.filter((p) => p.stockStatus !== "OUT_OF_STOCK").slice(0, 8)} />;
      }
      case "library":
        return <DigitalLibrary section={s} product={byId(libraryId)} />;
      case "reviews":
        return <Reviews section={s} reviews={reviews} />;
      case "faq":
        return <Faq title={s.title} items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />;
      case "trust":
        return <Trust section={s} />;
      case "final_cta":
        return <FinalCta section={s} />;
      default:
        return null;
    }
  };

  const base = siteUrl();
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: settings.store_name, url: base },
    ...kits.map((k) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: k.name,
      description: k.shortDescription ?? undefined,
      sku: k.sku,
      brand: { "@type": "Brand", name: settings.store_name },
      ...(k.imageUrl ? { image: k.imageUrl } : {}),
      offers: {
        "@type": "Offer",
        url: `${base}/produto/${k.slug}`,
        priceCurrency: "BRL",
        price: (k.priceCents / 100).toFixed(2),
        availability: k.stockStatus === "OUT_OF_STOCK" ? "https://schema.org/OutOfStock" : k.stockStatus === "PREORDER" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      },
    })),
    ...(faqs.length
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") } })) }]
      : []),
  ];

  return (
    <>
      {sections.map((s) => (
        <Fragment key={s.key}>{render(s)}</Fragment>
      ))}
      <LandingTracker />
      {isOn(settings.sticky_cta_enabled) && kits.length > 0 && <StickyMobileCTA label={settings.sticky_cta_label || "ESCOLHER MEU KIT"} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
