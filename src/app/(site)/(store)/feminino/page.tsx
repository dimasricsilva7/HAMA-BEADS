import type { Metadata } from "next";
import FootwearCatalog from "@/components/store/FootwearCatalog";
import { getPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Feminino | Crocs",
  description: "Explore o catálogo feminino: clogs, plataformas, sandálias, slides e acessórios.",
  alternates: { canonical: "/feminino" },
};

export default async function FemininoPage() {
  const products = await getPublicCatalog();
  return <FootwearCatalog products={products} initialCollection="111" initialCategory="ALL" />;
}
