export const HOME_SECTION_KEYS = ["black", "kids", "adult", "jibbitz"] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];
export type HomeSectionSelection = Record<HomeSectionKey, string[]>;

export type HomeSectionProductLike = {
  id: string;
  name: string;
  category: string;
  sourceCollectionId: string | null;
  sourceCollectionIds: string[];
  homeBlackFriday: boolean;
  badge: string | null;
  priceCents: number;
  listPriceCents: number | null;
};

export function parseHomeSectionSelection(raw: string | null | undefined): HomeSectionSelection | null {
  if (!raw?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = parsed as Record<string, unknown>;
    return {
      black: Array.isArray(value.black) ? [...new Set(value.black.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 10) : [],
      kids: Array.isArray(value.kids) ? [...new Set(value.kids.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 10) : [],
      adult: Array.isArray(value.adult) ? [...new Set(value.adult.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 10) : [],
      jibbitz: Array.isArray(value.jibbitz) ? [...new Set(value.jibbitz.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 10) : [],
    };
  } catch {
    return null;
  }
}

/** Agrupa registros do mesmo modelo em uma única opção de vitrine (as cores continuam no seletor do produto). */
export function homeProductFamilyKey(product: Pick<HomeSectionProductLike, "id" | "name" | "category">): string {
  if (product.category === "JIBBITZ") return `JIBBITZ:${product.id}`;
  const normalized = product.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return `${product.category}:${normalized}`;
}

export function defaultHomeSectionSelection<T extends HomeSectionProductLike>(products: T[]): HomeSectionSelection {
  const sourceIn = (product: T, ...ids: string[]) =>
    ids.some((id) => product.sourceCollectionIds.includes(id) || product.sourceCollectionId === id);
  const uniqueModels = (items: T[]) => {
    const seen = new Set<string>();
    return items.filter((product) => {
      const key = homeProductFamilyKey(product);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10).map((product) => product.id);
  };
  const black = products.filter((product) =>
    product.homeBlackFriday ||
    sourceIn(product, "595", "596", "599") ||
    (product.badge?.toLowerCase().includes("black") ?? false)
  ).sort((a, b) => {
    const aDiscount = a.listPriceCents && a.listPriceCents > a.priceCents ? 1 - a.priceCents / a.listPriceCents : 0;
    const bDiscount = b.listPriceCents && b.listPriceCents > b.priceCents ? 1 - b.priceCents / b.listPriceCents : 0;
    return bDiscount - aDiscount;
  });
  return {
    black: uniqueModels(black),
    kids: uniqueModels(products.filter((product) => sourceIn(product, "173") || product.category === "KIDS")),
    adult: uniqueModels(products.filter((product) => sourceIn(product, "111", "146"))),
    jibbitz: uniqueModels(products.filter((product) => sourceIn(product, "215") || product.category === "JIBBITZ")),
  };
}
