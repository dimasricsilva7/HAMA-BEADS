import Image from "next/image";
import { PixelArt, PixelIcon } from "@/components/ui/PixelArt";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { SectionCta } from "./Offers";
import { SectionHeading } from "./SectionHeading";
import { cfgArr, cfgStr, type SectionData } from "@/server/landing";
import type { IconItem } from "@/lib/domain";

function Visual({ url, alt, sprite, className = "" }: { url: string | null; alt: string; sprite: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-card border border-line bg-[#E4F4FF] shadow-soft ${className}`}>
      {url ? (
        <Image src={url} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      ) : (
        <div className="absolute inset-0" role="img" aria-label={`${alt} — ilustração`}>
          <div className="pegboard absolute inset-0" />
          <PixelArt sprite={sprite} className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2" />
          <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-white">Ilustração</span>
        </div>
      )}
    </div>
  );
}

export function ProductInUse({ section }: { section: SectionData }) {
  return (
    <section className="section bg-surface">
      <div className="container-page grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <Visual url={section.imageUrl} alt={section.title ?? "Produto em uso"} sprite={cfgStr(section.config, "spriteKey") || "cat"} className="aspect-[4/3]" />
        </Reveal>
        <Reveal>
          <SectionHeading eyebrow="Na prática" title={section.title} align="left" />
          <RichText text={section.body} className="lead mt-4" />
          {section.ctaLabel && (
            <a href={section.ctaTarget || "#kits"} data-cta="product_in_use_cta" className="btn-light mt-6">
              {section.ctaLabel}
            </a>
          )}
        </Reveal>
      </div>
    </section>
  );
}

const TONES = ["bg-primary text-white", "bg-secondary text-ink", "bg-accent text-white", "bg-success text-white"];

export function Benefits({ section }: { section: SectionData }) {
  const items = cfgArr<IconItem>(section.config, "items").filter((i) => i?.title);
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Por que Hama Beads" title={section.title} subtitle={section.subtitle} />
        <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 60}>
              <li className="card h-full p-4 sm:p-5">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${TONES[i % TONES.length]}`}>
                  <PixelIcon name={it.icon ?? "star"} className="h-6 w-6" />
                </span>
                <h3 className="mt-3 text-base font-extrabold leading-tight sm:text-lg">{it.title}</h3>
                {it.text && <p className="mt-1 text-[13px] leading-relaxed text-muted sm:text-sm">{it.text}</p>}
              </li>
            </Reveal>
          ))}
        </ul>
        <SectionCta section={section} />
      </div>
    </section>
  );
}

export function HowItWorks({ section }: { section: SectionData }) {
  const steps = cfgArr<{ title: string; text?: string }>(section.config, "steps").filter((s) => s?.title);
  const warning = cfgStr(section.config, "warning");
  return (
    <section id="como-funciona" className="section bg-ink text-white">
      <div className="container-page">
        <SectionHeading eyebrow="Passo a passo" title={section.title} subtitle={section.subtitle} tone="text-secondary" />
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 50}>
              <li className="flex h-full gap-4 rounded-card border border-white/10 bg-white/[0.06] p-5">
                <span className="font-pixel text-3xl leading-none text-secondary" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">{s.title}</h3>
                  {s.text && <p className="mt-1 text-sm leading-relaxed text-white/70">{s.text}</p>}
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        {warning && (
          <p className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl bg-secondary/15 p-4 text-sm leading-relaxed text-white" role="note">
            <PixelIcon name="iron" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <span>{warning}</span>
          </p>
        )}
        <SectionCta section={section} dark />
      </div>
    </section>
  );
}

export function Audience({ sections }: { sections: SectionData[] }) {
  if (!sections.length) return null;
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Para quem é" title="Para todas as idades" subtitle="Uma atividade criativa que funciona para a família toda." />
        <div className={`mt-10 grid gap-4 ${sections.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {sections.map((s, i) => {
            const items = cfgArr<string>(s.config, "items").filter(Boolean);
            const accent = cfgStr(s.config, "tone") === "accent";
            return (
              <Reveal key={s.key} delay={i * 80}>
                <article className={`relative h-full overflow-hidden rounded-card p-6 sm:p-8 ${accent ? "bg-accent/10" : "bg-primary/10"}`}>
                  <PixelArt sprite={cfgStr(s.config, "spriteKey") || "star"} className="absolute -right-3 -top-3 w-28 opacity-90 sm:w-36" />
                  <h3 className="relative max-w-[70%] font-display text-2xl font-extrabold sm:text-3xl">{s.title}</h3>
                  {s.subtitle && <p className="relative mt-2 max-w-[75%] text-muted">{s.subtitle}</p>}
                  {s.imageUrl && (
                    <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl">
                      <Image src={s.imageUrl} alt={s.title ?? ""} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <ul className="relative mt-5 space-y-2.5">
                    {items.map((it) => (
                      <li key={it} className="flex items-start gap-2.5 font-semibold">
                        <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-white ${accent ? "bg-accent" : "bg-primary"}`}>
                          <PixelIcon name="check" className="h-3.5 w-3.5" />
                        </span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>
        {sections.some((x) => x.ctaLabel) && <SectionCta section={sections.find((x) => x.ctaLabel)!} />}
      </div>
    </section>
  );
}

export function ModelsIncluded({ section }: { section: SectionData }) {
  const sprites = cfgArr<string>(section.config, "sprites");
  const note = cfgStr(section.config, "deliveryNote");
  return (
    <section id="modelos" className="section bg-secondary/25">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <SectionHeading eyebrow="Incluso em todos os kits" title={section.title} align="left" tone="text-ink" />
          <RichText text={section.body} className="lead mt-4" />
          {note && (
            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-surface p-4 text-sm font-semibold shadow-soft">
              <PixelIcon name="download" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              {note}
            </p>
          )}
        </Reveal>
        <Reveal>
          {section.imageUrl ? (
            <div className="relative aspect-square overflow-hidden rounded-card shadow-lift">
              <Image src={section.imageUrl} alt={section.title ?? "Modelos"} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div className="relative">
              <ul className="grid grid-cols-3 gap-3" aria-label="Exemplos de modelos (ilustração)">
                {sprites.slice(0, 6).map((s, i) => (
                  <li key={s} className={`aspect-square rounded-2xl bg-surface p-3 shadow-soft ring-1 ring-ink/5 ${i % 2 ? "translate-y-3" : ""}`}>
                    <PixelArt sprite={s} className="h-full w-full text-ink" board />
                  </li>
                ))}
              </ul>
              <span className="absolute -top-3 right-2 rotate-3 rounded-full bg-ink px-3 py-1 font-pixel text-xs text-white">100 modelos</span>
            </div>
          )}
        </Reveal>
        <div className="lg:col-span-2"><SectionCta section={section} /></div>
      </div>
    </section>
  );
}

type ReviewRow = { id: string; name: string; text: string; rating: number; photoUrl: string | null; videoUrl: string | null; reviewedAt: Date | string | null; product: { name: string } | null };

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${rating.toFixed(1).replace(".", ",")} de 5 estrelas`} role="img">
      <span className="text-secondary">{"★".repeat(r)}</span>
      <span className="text-line">{"★".repeat(5 - r)}</span>
    </span>
  );
}

/** Depoimentos — somente avaliações reais aprovadas no admin. Sem avaliações, a seção não aparece. */
export function Reviews({ section, reviews }: { section: SectionData; reviews: ReviewRow[] }) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const withMedia = reviews.filter((r) => r.photoUrl).length;
  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <section id="depoimentos" className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Avaliações" title={section.title} subtitle={section.subtitle} />
        <div className="mx-auto mt-6 flex w-fit flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full bg-surface px-5 py-2.5 shadow-soft">
          <span className="font-display text-2xl font-extrabold">{avg.toFixed(1).replace(".", ",")}</span>
          <Stars rating={avg} className="text-xl" />
          <span className="text-sm text-muted">
            {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
            {withMedia ? ` · ${withMedia} com foto` : ""}
          </span>
        </div>
        <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="card flex w-[85%] shrink-0 snap-center flex-col overflow-hidden sm:w-auto">
              {r.photoUrl && (
                <div className="relative aspect-square bg-bg">
                  <Image src={r.photoUrl} alt={`Foto enviada por ${r.name}`} fill sizes="(min-width: 1024px) 30vw, 85vw" className="object-cover" />
                </div>
              )}
              {!r.photoUrl && r.videoUrl && <VideoEmbed url={r.videoUrl} title={`Vídeo de ${r.name}`} vertical />}
              <div className="flex flex-1 flex-col p-5">
                <Stars rating={r.rating} className="text-lg" />
                <p className="mt-2 leading-relaxed">“{r.text}”</p>
                {r.photoUrl && r.videoUrl && <VideoEmbed url={r.videoUrl} title={`Vídeo de ${r.name}`} className="mt-4 rounded-xl" />}
                <div className="mt-auto flex items-center gap-3 pt-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary" aria-hidden="true">
                    {initials(r.name)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{r.name}</span>
                    {r.product && <span className="block text-xs text-muted">Comprou: {r.product.name}</span>}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Trust({ section }: { section: SectionData }) {
  const items = cfgArr<IconItem>(section.config, "items").filter((i) => i?.title);
  if (!items.length) return null;
  return (
    <section className="section bg-surface">
      <div className="container-page">
        <SectionHeading title={section.title} subtitle={section.subtitle} />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-line p-4">
              <PixelIcon name={it.icon ?? "shield"} className="h-7 w-7 shrink-0 text-primary" />
              <div>
                <p className="font-extrabold">{it.title}</p>
                {it.text && <p className="mt-0.5 text-sm text-muted">{it.text}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta({ section }: { section: SectionData }) {
  return (
    <section className="section">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="pegboard absolute inset-0 opacity-30 [filter:invert(1)]" aria-hidden="true" />
          <PixelArt sprite={cfgStr(section.config, "spriteKey") || "star"} className="relative mx-auto w-20 animate-float sm:w-24" />
          <h2 className="relative mt-5 font-display text-3xl font-extrabold sm:text-5xl">{section.title}</h2>
          {section.subtitle && <p className="relative mx-auto mt-3 max-w-lg text-white/85 sm:text-lg">{section.subtitle}</p>}
          <a href={section.ctaTarget || "#kits"} data-cta="final_cta" className="btn relative mt-8 bg-secondary text-ink shadow-pixel active:shadow-none">
            {section.ctaLabel || "Escolher meu kit"}
          </a>
        </div>
      </div>
    </section>
  );
}
