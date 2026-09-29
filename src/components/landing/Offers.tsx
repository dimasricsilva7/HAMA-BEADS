import { LedBoard } from "@/components/ui/LedBoard";
import { PixelIcon } from "@/components/ui/PixelArt";
import { Reveal } from "@/components/ui/Reveal";
import { AddToCartButton } from "./client";
import { cfgArr, cfgStr, type SectionData } from "@/server/landing";
import { formatBRL } from "@/utils/format";
import type { PublicProduct } from "@/types/catalog";

const nf = new Intl.NumberFormat("pt-BR");

/** Atalho de compra logo após o hero: os kits lado a lado, compra com um toque. */
export function QuickKits({ section, kits, highlightId }: { section: SectionData; kits: PublicProduct[]; highlightId: string | null }) {
  if (!kits.length) return null;
  return (
    <section id="comprar" className="pb-10 pt-2 sm:pb-14">
      <div className="container-page">
        <div className="flex items-end justify-between gap-3">
          <div>
            {section.title && <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{section.title}</h2>}
            {section.subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{section.subtitle}</p>}
          </div>
          <a href="#kits" className="hidden shrink-0 text-sm font-bold text-primary underline-offset-2 hover:underline sm:block">
            Comparar kits ↓
          </a>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {kits.map((k) => {
            const hl = k.id === highlightId;
            return (
              <li key={k.id} className={`relative flex flex-col rounded-2xl bg-surface p-3 shadow-soft sm:p-4 ${hl ? "ring-[3px] ring-primary" : "ring-1 ring-line"}`}>
                {(hl || k.badge) && (
                  <span className={`absolute -top-2.5 left-3 rounded-full px-2 py-0.5 font-pixel text-[9px] uppercase ${hl ? "bg-primary text-white" : "bg-ink text-white"}`}>{k.badge ?? "Recomendado"}</span>
                )}
                <p className="mt-1 font-display text-2xl font-extrabold leading-none sm:text-3xl">
                  {k.colorCount ?? "—"} <span className="text-sm font-bold">cores</span>
                </p>
                {k.beadCount != null && <p className="mt-1 text-xs font-semibold text-muted sm:text-sm">{nf.format(k.beadCount)} peças</p>}
                <p className="mt-2 font-display text-lg font-extrabold tabular-nums sm:text-xl">{formatBRL(k.priceCents)}</p>
                <AddToCartButton
                  product={{ id: k.id, name: k.name, sku: k.sku, priceCents: k.priceCents, category: k.category }}
                  label="Comprar"
                  element={`quick_${k.slug}`}
                  className={`mt-2 min-h-[44px] w-full rounded-xl text-sm font-extrabold uppercase active:translate-y-px ${hl ? "bg-primary text-white" : "bg-ink text-white"}`}
                  kitSelect
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-center text-xs text-muted sm:hidden">
          <a href="#kits" className="font-bold text-primary">Comparar o que vem em cada kit ↓</a>
        </p>
      </div>
    </section>
  );
}

/** Demonstração do Pegboard LED + preço especial (quando houver oferta ativa no checkout). */
export function LedBoardSection({ section, product, offerPriceCents }: { section: SectionData; product: PublicProduct | null; offerPriceCents: number | null }) {
  const items = cfgArr<string>(section.config, "items").filter(Boolean);
  const note = cfgStr(section.config, "offerNote");
  const image = section.imageUrl || product?.imageUrl || null;
  return (
    <section id="pegboard-led" className="section overflow-hidden bg-[#0d0b1e] text-white">
      <div className="container-page grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="relative mx-auto max-w-md">
            <div className="absolute -inset-6 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
            <LedBoard imageUrl={image} sprite="heart" className="relative aspect-square rounded-card ring-1 ring-white/10" />
          </div>
        </Reveal>
        <Reveal>
          <p className="eyebrow text-secondary">Novidade</p>
          {section.title && <h2 className="h-section mt-2">{section.title}</h2>}
          {section.subtitle && <p className="mt-3 text-lg leading-relaxed text-white/75">{section.subtitle}</p>}
          {items.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 font-semibold">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-secondary text-ink">
                    <PixelIcon name="check" className="h-3.5 w-3.5" />
                  </span>
                  {it}
                </li>
              ))}
            </ul>
          )}
          {product && (
            <div className="mt-6 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
              {offerPriceCents && offerPriceCents < product.priceCents ? (
                <>
                  <p className="text-sm text-white/70">
                    Preço normal <s>{formatBRL(product.priceCents)}</s>
                  </p>
                  <p className="font-display text-3xl font-extrabold text-secondary">
                    {formatBRL(offerPriceCents)} <span className="text-base font-bold text-white">junto com o seu kit</span>
                  </p>
                  <p className="mt-1 text-sm text-white/70">{note || `Oferta exclusiva no checkout: ${Math.round((1 - offerPriceCents / product.priceCents) * 100)}% de desconto.`}</p>
                </>
              ) : (
                <p className="font-display text-3xl font-extrabold text-secondary">{formatBRL(product.priceCents)}</p>
              )}
            </div>
          )}
          <a href={section.ctaTarget || "#kits"} data-cta="led_cta" className="btn mt-6 w-full bg-secondary text-ink shadow-[0_4px_0_0_rgba(255,255,255,0.9)] active:shadow-none sm:w-auto">
            {section.ctaLabel || "Escolher meu kit"}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/** Botão "Ver kits" reutilizado no fim das seções de conteúdo. */
export function SectionCta({ section, dark = false }: { section: SectionData; dark?: boolean }) {
  if (!section.ctaLabel) return null;
  return (
    <div className="mt-8 text-center">
      <a href={section.ctaTarget || "#kits"} data-cta={`${section.key}_cta`} className={dark ? "btn bg-secondary text-ink shadow-[0_4px_0_0_rgba(255,255,255,0.9)] active:shadow-none" : "btn-primary"}>
        {section.ctaLabel}
      </a>
    </div>
  );
}
