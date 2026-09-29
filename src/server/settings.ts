import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { SETTING_DEFAULTS } from "@/lib/settings-defaults";

export type Settings = Record<string, string>;

const toStr = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

async function load(): Promise<Settings> {
  const rows = await db.setting.findMany().catch(() => []);
  const map: Settings = { ...SETTING_DEFAULTS };
  for (const r of rows) map[r.key] = toStr(r.value);
  return map;
}

/** Leitura com cache (páginas). Invalidada pela tag "settings" ao salvar no admin. */
export const getSettings = unstable_cache(load, ["settings"], { tags: ["settings"], revalidate: 300 });

/** Leitura sem cache (checkout, jobs, webhooks): valores sempre atuais. */
export const getSettingsFresh = load;

export function settingInt(settings: Settings, key: string, fallback: number): number {
  const n = Number.parseInt(settings[key] ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export const isOn = (v: string | undefined) => v === "true";

const PIXEL_RE = /^\d{5,20}$/;
const GA_RE = /^G-[A-Z0-9]{4,15}$/;

/** IDs de rastreamento: configuração do admin tem prioridade; env é o fallback. Sempre validados. */
export function trackingIds(s: Settings) {
  const pixel = (s.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
  const ga = (s.ga_id || process.env.NEXT_PUBLIC_GA_ID || "").trim();
  return {
    metaPixelId: isOn(s.meta_pixel_enabled) && PIXEL_RE.test(pixel) ? pixel : null,
    gaId: isOn(s.ga_enabled) && GA_RE.test(ga) ? ga : null,
    capiEnabled: isOn(s.meta_capi_enabled) && PIXEL_RE.test(pixel) && Boolean(process.env.META_ACCESS_TOKEN),
    pixelIdForCapi: PIXEL_RE.test(pixel) ? pixel : null,
  };
}
