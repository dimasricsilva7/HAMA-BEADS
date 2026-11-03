import type { Metadata } from "next";
import FootwearHome from "@/components/store/FootwearHome";
import { getPublicCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calçados e acessórios",
  description: "Encontre calçados e acessórios para diferentes momentos da sua rotina.",
};

export default async function StorefrontPage() {
  const [catalog, settings] = await Promise.all([getPublicCatalog(), getSettings()]);
  // A home não precisa hidratar o catálogo inteiro no navegador. Envie apenas
  // os produtos que podem aparecer nos quatro trilhos principais (até 40).
  const adult = catalog.filter((p) => p.sourceCollectionIds.some((id) => ["111", "146"].includes(id)));
  const kids = catalog.filter((p) => p.sourceCollectionIds.includes("173") || p.category === "KIDS");
  const jibbitz = catalog.filter((p) => p.sourceCollectionIds.includes("215") || p.category === "JIBBITZ");
  const sale = catalog.filter((p) => p.homeBlackFriday).sort((a, b) => (b.individualDiscountPercent ?? 0) - (a.individualDiscountPercent ?? 0));
  const selected = [...sale.slice(0, 10), ...kids.slice(0, 10), ...adult.slice(0, 10), ...jibbitz.slice(0, 10)];
  const products = [...new Map(selected.map((p) => [p.id, p])).values()];
  return <FootwearHome products={products} storeName={settings.store_name || "Calçados & Acessórios"} heroImageUrl={settings.hero_banner_url || null} />;
}
