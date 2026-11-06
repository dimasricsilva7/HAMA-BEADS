import type { Metadata } from "next";
import FootwearCatalog from "@/components/store/FootwearCatalog";
import { getPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Masculino | Crocs",
  description: "Explore o catálogo masculino: clogs, sandálias, slides e acessórios.",
  alternates: { canonical: "/masculino" },
};

export default async function MasculinoPage() {
  const products = await getPublicCatalog();
  return <FootwearCatalog products={products} initialCollection="146" initialCategory="ALL" />;
}
