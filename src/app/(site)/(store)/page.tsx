import type { Metadata } from "next";
import FootwearHome from "@/components/store/FootwearHome";
import { getHomeCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";
import { defaultHomeSectionSelection, parseHomeSectionSelection } from "@/lib/home-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calçados e acessórios",
  description: "Encontre calçados e acessórios para diferentes momentos da sua rotina.",
};

export default async function StorefrontPage() {
  const [catalog, settings] = await Promise.all([getHomeCatalog(), getSettings()]);
  const sectionProductIds = parseHomeSectionSelection(settings.home_section_products) ?? defaultHomeSectionSelection(catalog);
  const uniqueIds = [...new Set([
    ...sectionProductIds.black,
    ...sectionProductIds.kids,
    ...sectionProductIds.adult,
    ...sectionProductIds.jibbitz,
  ])];
  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  const selected = uniqueIds.map((id) => catalogById.get(id)).filter((product): product is (typeof catalog)[number] => Boolean(product));
  const blackIds = new Set(sectionProductIds.black);
  const products = selected.map((p) => ({
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
    homeBlackFriday: false,
    colorFamilyCount: p.colorFamily.length,
    colorFamily: p.colorFamily.map(({ id, slug, value, imageUrl }) => ({ id, slug, value, imageUrl })),
    variants: p.variants.slice(0, 40).map(({ id, sku, options, priceCents, stockQuantity, available }) => ({ id, sku, options, priceCents, stockQuantity, available })),
  }));
  return <FootwearHome
    products={products}
    sectionProductIds={sectionProductIds}
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
