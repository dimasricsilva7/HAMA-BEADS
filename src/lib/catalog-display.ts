export type CatalogColorSwatch = {
  id: string;
  slug: string;
  value: string;
  imageUrl: string | null;
  priceCents: number;
  listPriceCents: number | null;
  available: boolean;
};

export type CatalogDisplayProduct = {
  id: string;
  name: string;
  category: string;
  sourceCollectionId: string | null;
  sourceCollectionIds: string[];
  colorFamily: CatalogColorSwatch[];
};

/** Normalização única para identificar o mesmo modelo vendido em cores diferentes. */
const COLOR_SUFFIXES = [
  "winter white/multi", "white/multi", "black/black", "black/white", "white/black",
  "navy/white", "pink/white", "white", "black", "navy", "bone", "oyster",
  "stucco", "khaki", "beige", "sand", "multi", "pink", "rose", "red",
  "blue", "green", "yellow", "purple", "grey", "gray", "brown", "tan",
  "preto", "preta", "branco", "branca", "azul", "verde", "rosa", "vermelho",
  "amarelo", "cinza", "marrom", "bege", "areia",
];

/** Normaliza nome e remove apenas um sufixo conhecido de cor para reunir colorways. */
export function normalizeCatalogModelName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
  const colorSuffix = new RegExp("(?:\\s+|\\s*[-/]\\s*)(?:" + COLOR_SUFFIXES.join("|") + ")$", "i");
  return normalized.replace(colorSuffix, "").trim();
}

export function catalogFamilyKey(product: Pick<CatalogDisplayProduct, "category" | "name">): string {
  return `${product.category}:${normalizeCatalogModelName(product.name)}`;
}

/** Filtra estritamente pelas coleções selecionadas na origem VTEX. */
export function filterCatalogByCollection<T extends Pick<CatalogDisplayProduct, "sourceCollectionId" | "sourceCollectionIds">>(
  products: T[],
  collection: string,
): T[] {
  const ids = collection.split(",").map((id) => id.trim()).filter(Boolean);
  if (!ids.length || collection === "ALL") return products;
  return products.filter((product) =>
    ids.some((id) => product.sourceCollectionIds.includes(id) || product.sourceCollectionId === id),
  );
}

/**
 * Um card por modelo, não um card por cor. As opções de cor exibidas são
 * limitadas aos produtos que passaram pelo filtro atual (ex.: Masculino).
 */
export function deduplicateCatalogColorways<T extends CatalogDisplayProduct>(products: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const product of products) {
    const key = product.category === "JIBBITZ"
      ? `JIBBITZ:${product.id}`
      : catalogFamilyKey(product);
    const group = groups.get(key) ?? [];
    group.push(product);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    const representative = group[0];
    if (group.length === 1) {
      const ids = new Set([representative.id]);
      const ownColors = representative.colorFamily.filter((color) => ids.has(color.id));
      return { ...representative, colorFamily: ownColors.length ? ownColors : representative.colorFamily };
    }

    const allowedIds = new Set(group.map((product) => product.id));
    const seen = new Set<string>();
    const colors: CatalogColorSwatch[] = [];
    for (const product of group) {
      for (const color of product.colorFamily) {
        if (!allowedIds.has(color.id)) continue;
        const key = `${color.id}:${color.value.toLocaleLowerCase("pt-BR")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        colors.push(color);
      }
    }
    return { ...representative, colorFamily: colors.length ? colors : representative.colorFamily };
  });
}
