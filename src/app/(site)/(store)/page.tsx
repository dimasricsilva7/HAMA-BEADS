import type { Metadata } from "next";
import FootwearHome from "@/components/store/FootwearHome";
import { getHomeCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calçados e acessórios",
  description: "Encontre calçados e acessórios para diferentes momentos da sua rotina.",
};

export default async function StorefrontPage() {
  const [catalog, settings] = await Promise.all([getHomeCatalog(), getSettings()]);
  const inSource = (p: (typeof catalog)[number], ...ids: string[]) => ids.some((id) => p.sourceCollectionIds.includes(id) || p.sourceCollectionId === id);
  const adult = catalog.filter((p) => inSource(p, "111", "146"));
  const kids = catalog.filter((p) => inSource(p, "173") || p.category === "KIDS");
  const jibbitz = catalog.filter((p) => inSource(p, "215") || p.category === "JIBBITZ");
  const sale = catalog.filter((p) => p.homeBlackFriday).sort((a, b) => (b.individualDiscountPercent ?? 0) - (a.individualDiscountPercent ?? 0));
  const selected = new Map<string, (typeof catalog)[number]>();
  for (const product of [...sale.slice(0, 10), ...kids.slice(0, 10), ...adult.slice(0, 10), ...jibbitz.slice(0, 10)]) selected.set(product.id, product);
  const products = [...selected.values()].map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    priceCents: p.priceCents,
    listPriceCents: p.listPriceCents,
    individualDiscountPercent: p.individualDiscountPercent,
    imageUrl: p.imageUrl,
    badge: p.badge,
    category: p.category,
    sourceCollectionId: p.sourceCollectionId,
    sourceCollectionIds: p.sourceCollectionIds,
    stockStatus: p.stockStatus,
    homeBlackFriday: p.homeBlackFriday,
    colorFamilyCount: p.colorFamily.length,
    colorFamily: p.colorFamily.slice(0, 5).map(({ id, slug, value }) => ({ id, slug, value })),
    variants: p.variants
      .filter((v) => v.available && v.stockQuantity > 0)
      .slice(0, 40)
      .map(({ id, sku, options, priceCents, stockQuantity, available }) => ({ id, sku, options, priceCents, stockQuantity, available })),
  }));
  return <FootwearHome
    products={products}
    storeName={settings.store_name || "Calçados & Acessórios"}
    heroImageUrl={settings.hero_banner_url || null}
    categoryImages={{
      adult: settings.adult_banner_url || "/images/category-adulto.webp",
      kids: settings.kids_banner_url || "/images/category-infantil.webp",
      jibbitz: settings.jibbitz_banner_url || "/images/category-jibbitz.webp",
    }}
    copy={{
      heroEyebrow: settings.home_hero_eyebrow, heroTitle: settings.home_hero_title, heroDescription: settings.home_hero_description, heroCtaLabel: settings.home_hero_cta_label,
      blackTitle: settings.home_black_title, blackDescription: settings.home_black_description,
      kidsTitle: settings.home_kids_title, kidsDescription: settings.home_kids_description,
      adultTitle: settings.home_adult_title, adultDescription: settings.home_adult_description,
      jibbitzTitle: settings.home_jibbitz_title, jibbitzDescription: settings.home_jibbitz_description,
      jibbitzBannerEyebrow: settings.home_jibbitz_banner_eyebrow, jibbitzBannerTitle: settings.home_jibbitz_banner_title,
      jibbitzBannerDescription: settings.home_jibbitz_banner_description, jibbitzBannerCta: settings.home_jibbitz_banner_cta,
      jibbitzRailTitle: settings.home_jibbitz_rail_title, jibbitzRailDescription: settings.home_jibbitz_rail_description,
      categoryAdultLabel: settings.home_category_adult_label, categoryKidsLabel: settings.home_category_kids_label,
      categoryJibbitzLabel: settings.home_category_jibbitz_label, resellerNotice: settings.reseller_notice_home,
    }}
  />;
}
