import type { Metadata } from "next";
import FootwearCatalog from "@/components/store/FootwearCatalog";
import { getPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Todos os produtos", description: "Explore calçados, sandálias, slides, modelos infantis e acessórios.", alternates: { canonical: "/loja" } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StorePage({ searchParams }: Props) {
  const [products, params] = await Promise.all([getPublicCatalog(), searchParams]);
  const value = (key: string): string => {
    const item = params[key];
    return Array.isArray(item) ? item[0] ?? "" : item ?? "";
  };
  return (
    <FootwearCatalog
      products={products}
      initialCollection={value("colecao") || "ALL"}
      initialDeals={value("ofertas") === "1"}
      minPrice={Number(value("precoDe")) || 0}
      maxPrice={Number(value("precoAte")) || 0}
    />
  );
}
