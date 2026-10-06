import Link from "next/link";
import Image from "next/image";
import { PixelIcon, PixelArt } from "@/components/ui/PixelArt";
import { Price } from "@/components/ui/Price";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Reveal } from "@/components/ui/Reveal";
import { AddToCartButton, ViewTracker } from "./client";
import { SectionHeading } from "./SectionHeading";
import { cfgArr, type SectionData } from "@/server/landing";
import type { PublicProduct } from "@/types/catalog";
import type { ComponentType } from "@/lib/domain";
import { formatBRL } from "@/utils/format";

const nf = new Intl.NumberFormat("pt-BR");
export const COMPONENT_ICON: Record<ComponentType, string> = { beads: "palette", pegboard: "grid", tweezers: "hand", tool: "iron", accessory: "puzzle", digital: "download", bonus: "gift" };
/** Itens da composição exibidos no card (o restante fica na página do produto). */
const KIT_CARD_ITEMS = 5;
const ref = (p: PublicProduct) => ({ id: p.id, name: p.name, sku: p.sku, priceCents: p.priceCents, category: p.category });

export function KitCard({ p, index, highlighted }: { p: PublicProduct; index: number; highlighted: boolean }) {
  const soldOut = p.stockStatus === "OUT_OF_STOCK";
  return (
    <ViewTracker event="product_view" productId={p.id} valueCents={p.priceCents} meta={{ sku: p.sku, name: p.name, priceCents: p.priceCents, category: p.category }} className="h-full">
      {/* Mobile: card horizontal compacto · Tablet/desktop: card vertical com a composição */}
      <article className={`relative flex h-full flex-row overflow-hidden rounded-card bg-surface md:flex-col ${highlighted ? "border-[3px] border-primary shadow-lift lg:-translate-y-3" : "border border-line shadow-soft"}`}>
        {p.badge && (
          <span className={`absolute left-4 top-4 z-10 hidden rounded-full px-3 py-1 font-pixel text-[11px] uppercase md:block ${highlighted ? "bg-primary text-white" : "bg-ink text-white"}`}>{p.badge}</span>
        )}
        <div className="w-[34%] shrink-0 md:w-auto">
          <ProductVisual imageUrl={p.imageUrl} name={p.name} category={p.category} index={index} className="h-full min-h-[168px] md:h-auto md:min-h-0 md:aspect-[4/3]" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 34vw" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3.5 md:p-5">
          {p.badge && <span className={`mb-1 w-fit rounded-full px-2 py-0.5 font-pixel text-[9px] uppercase md:hidden ${highlighted ? "bg-primary text-white" : "bg-ink text-white"}`}>{p.badge}</span>}
          <h3 className="font-display text-lg font-extrabold leading-tight md:text-2xl">{p.name}</h3>
          {p.beadCount != null && (
            <p className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-primary md:mt-1 md:text-4xl">
              {nf.format(p.beadCount)} <span className="text-xs font-bold text-ink md:text-base">peças{p.colorCount ? ` · ${p.colorCount} cores` : ""}</span>
            </p>
          )}
          {p.shortDescription && <p className="mt-2 hidden text-sm leading-relaxed text-muted md:block">{p.shortDescription}</p>}
          {p.components.length > 0 && (
            <ul className="mt-4 hidden space-y-2 text-sm md:block">
              {p.components.slice(0, KIT_CARD_ITEMS).map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md ${c.isBonus || c.type === "bonus" ? "bg-accent text-white" : "bg-success/15 text-success"}`}>
                    <PixelIcon name={c.isBonus || c.type === "bonus" ? "gift" : "check"} className="h-3 w-3" />
                  </span>
                  <span>
                    {c.quantity && !c.label.startsWith(c.quantity) ? `${c.quantity}× ` : ""}
                    {c.label}
                    {(c.isBonus || c.type === "bonus") && <b className="ml-1 text-accent">bônus</b>}
                  </span>
                </li>
              ))}
              {p.components.length > KIT_CARD_ITEMS && (
                <li>
                  <Link href={`/produto/${p.slug}`} className="font-bold text-primary underline-offset-2 hover:underline">
                    + {p.components.length - KIT_CARD_ITEMS} itens inclusos — ver tudo
                  </Link>
                </li>
              )}
            </ul>
          )}
          {p.shortDescription && p.shortDescription.length <= 90 && <p className="mt-1 text-[13px] leading-snug text-ink/80 md:hidden">{p.shortDescription}</p>}
          <p className="mt-1 text-xs text-muted md:hidden">Mini ferro, placa, pinças e brinde inclusos</p>
          <div className="mt-auto pt-2 md:pt-5">
            {p.promoLabel && <p className="mb-1 text-xs font-bold uppercase text-accent">{p.promoLabel}</p>}
            <div className="flex items-baseline gap-2 md:block">
              <Price priceCents={p.priceCents} listPriceCents={p.listPriceCents} className="[&>span:last-child]:text-2xl md:[&>span:last-child]:text-3xl" />
              <p className="text-xs text-muted">no PIX</p>
            </div>
            {soldOut ? (
              <p className="mt-3 rounded-xl bg-ink/5 py-3 text-center text-sm font-bold md:mt-4">Esgotado no momento</p>
            ) : (
              <AddToCartButton
                product={ref(p)}
                label={p.stockStatus === "PREORDER" ? "Garantir na pré-venda" : "Escolher este kit"}
                element={`kit_${p.slug}`}
                className={`${highlighted ? "btn-primary" : "btn-light"} mt-2.5 min-h-[46px] w-full px-3 text-sm md:mt-4 md:min-h-[52px] md:text-[15px]`}
                kitSelect
              />
            )}
            <Link href={`/produto/${p.slug}`} className="mt-1.5 block text-center text-xs font-bold text-muted underline-offset-2 hover:underline md:btn-ghost md:mt-1 md:w-full">
              <span className="md:hidden">O que vem no kit →</span>
              <span className="hidden md:inline">Ver detalhes do kit</span>
            </Link>
          </div>
        </div>
      </article>
    </ViewTracker>
  );
}

export function KitSelector({ section, kits, highlightId }: { section: SectionData; kits: PublicProduct[]; highlightId: string | null }) {
  if (!kits.length) return null;
  type Row = { label: string; get: (p: PublicProduct) => string | null };
  const allRows: Row[] = [
    { label: "Peças", get: (p) => (p.beadCount != null ? nf.format(p.beadCount) : null) },
    { label: "Cores", get: (p) => (p.colorCount != null ? String(p.colorCount) : null) },
    { label: "Pegboards", get: (p) => (p.pegboardCount != null ? String(p.pegboardCount) : null) },
    { label: "Modelos digitais", get: (p) => (p.modelCount != null ? String(p.modelCount) : null) },
    { label: "Bônus", get: (p) => p.components.filter((c) => c.isBonus || c.type === "bonus").map((c) => c.label.split(" ").slice(0, 2).join(" ")).join(", ") || "—" },
  ];
  const same = (r: Row) => new Set(kits.map((k) => r.get(k))).size === 1;
  const rows = allRows.filter((r) => kits.some((k) => r.get(k) && r.get(k) !== "—") && !(r.label === "Bônus" && same(r)));
  const sharedBonus = kits[0]?.components.filter((c) => c.isBonus || c.type === "bonus").map((c) => c.label) ?? [];
  const bonusInAll = allRows.find((r) => r.label === "Bônus" && same(r) && r.get(kits[0]) !== "—") ? sharedBonus : [];

  return (
    <section id="kits" className="section bg-gradient-to-b from-bg to-primary/[0.06]">
      <div className="container-page">
        <SectionHeading title={section.title} subtitle={section.subtitle} />
        <div className={`mt-8 grid gap-3 md:mt-10 md:gap-5 ${kits.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : kits.length === 3 ? "lg:grid-cols-3" : kits.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-md"} lg:items-stretch`}>
          {kits.map((k, i) => (
            <Reveal key={k.id} delay={i * 80} className={`h-full ${k.id === highlightId ? "order-first md:order-none" : ""}`}>
              <KitCard p={k} index={i} highlighted={k.id === highlightId} />
            </Reveal>
          ))}
        </div>

        {kits.length > 1 && rows.length > 0 && (
          <div className="mt-12">
            <h3 className="text-center font-display text-2xl font-extrabold">Compare lado a lado</h3>
            <div className="mt-5 overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full table-fixed text-left text-[12px] sm:text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="w-[22%] p-2 font-semibold text-muted sm:w-1/4 sm:p-4">
                      <span className="sr-only">Característica</span>
                    </th>
                    {kits.map((k) => (
                      <th key={k.id} scope="col" className={`p-2 font-extrabold leading-tight sm:p-4 ${k.id === highlightId ? "text-primary" : ""}`}>
                        <span className="sm:hidden">{k.colorCount ? `${k.colorCount} cores` : k.name}</span>
                        <span className="hidden sm:inline">{k.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className="border-b border-line last:border-0">
                      <th scope="row" className="p-2 font-semibold leading-tight text-muted sm:p-4">{r.label}</th>
                      {kits.map((k) => (
                        <td key={k.id} className={`break-words p-2 font-bold leading-snug tabular-nums sm:p-4 ${k.id === highlightId ? "bg-primary/[0.05]" : ""}`}>
                          {r.get(k) ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="p-2 font-semibold leading-tight text-muted sm:p-4">Preço</th>
                    {kits.map((k) => (
                      <td key={k.id} className={`whitespace-nowrap p-2 font-extrabold tabular-nums tracking-tight sm:p-4 sm:text-base ${k.id === highlightId ? "bg-primary/[0.05]" : ""}`}>
                        {formatBRL(k.priceCents)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {bonusInAll.length > 0 && (
              <p className="mt-3 text-center text-sm text-muted">
                <b className="text-accent">Bônus em todos os kits:</b> {bonusInAll.join(", ").toLowerCase()}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function OfferSection({ section, product }: { section: SectionData; product: PublicProduct | null }) {
  if (!product || !product.components.length) return null;
  return (
    <section id="oferta" className="section bg-ink text-white">
      <div className="container-page">
        <SectionHeading eyebrow={product.name} title={section.title} subtitle={section.subtitle} tone="text-secondary" />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {product.components.map((c, i) => {
            const bonus = c.isBonus || c.type === "bonus";
            return (
              <Reveal key={c.id} delay={i * 40}>
                <li className={`relative flex h-full flex-col items-center rounded-card p-4 text-center ${bonus ? "bg-accent text-white" : "bg-white/[0.07] ring-1 ring-white/10"}`}>
                  {bonus && <span className="absolute -top-2.5 rounded-full bg-secondary px-2.5 py-0.5 font-pixel text-[10px] text-ink">BÔNUS</span>}
                  {c.imageUrl ? (
                    <span className="relative mb-3 block h-16 w-16 overflow-hidden rounded-xl bg-white">
                      <Image src={c.imageUrl} alt={c.label} fill sizes="64px" className="object-cover" />
                    </span>
                  ) : (
                    <span className={`mb-3 grid h-14 w-14 place-items-center rounded-2xl ${bonus ? "bg-white/20" : "bg-white/10"}`}>
                      <PixelIcon name={COMPONENT_ICON[c.type] ?? "star"} className="h-7 w-7" />
                    </span>
                  )}
                  <p className="text-sm font-extrabold leading-tight">{c.label}</p>
                  {c.quantity && !c.label.startsWith(c.quantity) && <p className="mt-1 text-xs text-white/70">Qtd.: {c.quantity}</p>}
                  {c.detail && <p className="mt-1 text-xs text-white/70">{c.detail}</p>}
                </li>
              </Reveal>
            );
          })}
        </ul>
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center text-center">
          <Price priceCents={product.priceCents} listPriceCents={product.listPriceCents} size="lg" className="justify-center [&_.line-through]:text-white/60" />
          <p className="text-sm text-white/70">no PIX</p>
          <AddToCartButton product={ref(product)} label={section.ctaLabel || `Quero o ${product.name}`} element="offer_cta" className="btn mt-5 w-full bg-secondary text-ink shadow-[0_4px_0_0_rgba(255,255,255,0.9)] active:shadow-none" kitSelect />
        </div>
      </div>
    </section>
  );
}

export function CompleteKit({ section, products }: { section: SectionData; products: PublicProduct[] }) {
  if (!products.length) return null;
  return (
    <section id="complementos" className="section">
      <div className="container-page">
        <SectionHeading title={section.title} subtitle={section.subtitle} />
        <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <li key={p.id}>
              <ViewTracker event="product_view" productId={p.id} valueCents={p.priceCents} meta={{ sku: p.sku, name: p.name, priceCents: p.priceCents, category: p.category }} className="h-full">
                <article className="card flex h-full flex-col overflow-hidden">
                  <ProductVisual imageUrl={p.imageUrl} name={p.name} category={p.category} index={i + 1} className="aspect-square" sizes="(min-width: 1024px) 25vw, 50vw" />
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <h3 className="text-sm font-extrabold leading-tight sm:text-base">{p.name}</h3>
                    {p.shortDescription && <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{p.shortDescription}</p>}
                    <div className="mt-auto pt-3">
                      <Price priceCents={p.priceCents} listPriceCents={p.listPriceCents} size="sm" />
                      <AddToCartButton product={ref(p)} label="+ Adicionar" element={`complete_kit_${p.slug}`} className="mt-2 min-h-[44px] w-full rounded-xl bg-ink text-sm font-bold text-white active:translate-y-px" source="cross_sell" />
                    </div>
                  </div>
                </article>
              </ViewTracker>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function DigitalLibrary({ section, product }: { section: SectionData; product: PublicProduct | null }) {
  if (!product) return null;
  const categories = cfgArr<string>(section.config, "categories").filter(Boolean);
  return (
    <section id="biblioteca" className="section">
      <div className="container-page">
        <ViewTracker event="product_view" productId={product.id} valueCents={product.priceCents} meta={{ sku: product.sku, name: product.name, priceCents: product.priceCents, category: product.category }}>
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border-2 border-ink bg-surface p-6 shadow-pixel sm:p-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="eyebrow text-accent">Biblioteca digital</p>
              <h2 className="h-section mt-2">{section.title}</h2>
              {section.subtitle && <p className="lead mt-3">{section.subtitle}</p>}
              {product.modelCount != null && (
                <p className="mt-5 font-display text-6xl font-extrabold tracking-tight text-accent">
                  {product.modelCount}+ <span className="text-2xl text-ink">modelos</span>
                </p>
              )}
              {categories.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Categorias">
                  {categories.map((c) => (
                    <li key={c} className="chip bg-ink/5 text-ink">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Price priceCents={product.priceCents} listPriceCents={product.listPriceCents} />
                <AddToCartButton product={ref(product)} label={section.ctaLabel || "Adicionar ao pedido"} element="library_cta" className="btn-accent" source="cross_sell" />
              </div>
            </div>
            <div className="relative grid grid-cols-4 gap-2" aria-hidden="true">
              {["heart", "cat", "rocket", "cherry", "frog", "gem", "sun", "donut", "gamepad", "flower", "robot", "house"].map((s, i) => (
                <div key={s} className={`aspect-square rounded-xl bg-bg p-1.5 ring-1 ring-line ${i % 3 === 1 ? "translate-y-2" : ""}`}>
                  <PixelArt sprite={s} className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </ViewTracker>
      </div>
    </section>
  );
}
