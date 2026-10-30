import type { Metadata } from "next";
import FootwearCatalog from "@/components/store/FootwearCatalog";
import { getPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Todos os produtos", description: "Explore calçados, sandálias, slides, modelos infantis e acessórios.", alternates: { canonical: "/loja" } };

export default async function StorePage() {
  const products = await getPublicCatalog();
  return <FootwearCatalog products={products} />;
}
