import type { Metadata } from "next";
import { FootwearHome } from "@/components/store/FootwearHome";
import { getPublicCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calçados e acessórios",
  description: "Encontre calçados e acessórios para diferentes momentos da sua rotina.",
};

export default async function StorefrontPage() {
  const [products, settings] = await Promise.all([getPublicCatalog(), getSettings()]);
  return <FootwearHome products={products} storeName={settings.store_name || "Sua Loja"} />;
}
