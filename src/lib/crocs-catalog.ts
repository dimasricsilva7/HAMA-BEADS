export const CROCS_CATEGORY_COLLECTION_IDS = ["111", "146", "173", "215", "225", "1792513037"] as const;
export const CROCS_CAMPAIGN_COLLECTION_IDS = ["595", "596", "599"] as const;

/** Extrai as coleções raiz reais retornadas pela VTEX (ex.: /111/112/113/). */
export function crocsCategoryCollectionIds(value: unknown, fallback?: string): string[] {
  const raw = Array.isArray(value) ? value : [];
  const allowed = new Set<string>(CROCS_CATEGORY_COLLECTION_IDS);
  const ids = raw.flatMap((path) => {
    if (typeof path !== "string") return [];
    const match = path.match(/^\/(\d+)(?:\/|$)/);
    return match && allowed.has(match[1]) ? [match[1]] : [];
  });
  if (ids.length) return [...new Set(ids)];
  return fallback && allowed.has(fallback) ? [fallback] : [];
}
