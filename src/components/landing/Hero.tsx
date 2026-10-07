import Image from "next/image";
import { PixelArt } from "@/components/ui/PixelArt";
import type { SectionData } from "@/server/landing";
import { cfgArr, cfgStr } from "@/server/landing";

type Stat = { value: string; label: string };

export function Hero({ section, headline, ctaLabel, imageUrl }: { section: SectionData; headline: string; ctaLabel: string; imageUrl: string | null }) {
  const c = section.config;
  const stats = cfgArr<Stat>(c, "stats").filter((s) => s?.value);
  const secondaryLabel = cfgStr(c, "secondaryCtaLabel");
  const secondaryTarget = cfgStr(c, "secondaryCtaTarget") || "#como-funciona";
  const sprite = cfgStr(c, "spriteKey") || "heart";

  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="pegboard pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
      <div className="container-page relative grid items-center gap-8 pb-12 pt-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-20 lg:pt-16">
        <div className="animate-rise">
          {cfgStr(c, "eyebrow") && (
            <p className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-white">
              <span className="flex gap-0.5" aria-hidden="true">
                <i className="block h-2 w-2 rounded-[3px] bg-accent" />
                <i className="block h-2 w-2 rounded-[3px] bg-secondary" />
                <i className="block h-2 w-2 rounded-[3px] bg-primary" />
              </span>
              <span className="eyebrow">{cfgStr(c, "eyebrow")}</span>
            </p>
          )}
          <h1 className="mt-4 font-display text-[2.35rem] font-extrabold leading-[1.02] sm:text-5xl lg:text-[3.6rem]">{headline}</h1>
          {section.subtitle && <p className="lead mt-4 max-w-xl">{section.subtitle}</p>}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <a href={section.ctaTarget || "#kits"} data-cta="hero_cta" className="btn-primary w-full sm:w-auto sm:px-8">
              {ctaLabel}
            </a>
            {secondaryLabel && (
              <a href={secondaryTarget} data-cta="hero_secondary" className="btn-ghost">
                {secondaryLabel} ↓
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] animate-rise [animation-delay:120ms]">
          <div className="relative aspect-[5/4] overflow-hidden rounded-card border-2 border-ink bg-surface shadow-pixel sm:aspect-square">
            {imageUrl ? (
              <Image src={imageUrl} alt={section.title ?? "Kit Hama Beads"} fill priority sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#FFF1D6]" role="img" aria-label="Ilustração de uma criação em Hama Beads no pegboard">
                <div className="pegboard absolute inset-0" />
                <div className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2">
                  <div className="animate-float rounded-[16%] bg-white p-[5%] shadow-lift ring-1 ring-ink/10">
                    <PixelArt sprite={sprite} className="h-full w-full text-ink" board />
                  </div>
                </div>
                <PixelArt sprite="star" className="absolute left-[6%] top-[8%] w-[17%] rotate-[-12deg]" />
                <PixelArt sprite="cherry" className="absolute bottom-[8%] right-[6%] w-[18%] rotate-[10deg]" />
                <PixelArt sprite="gem" className="absolute bottom-[10%] left-[8%] w-[13%]" />
                <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-white">Ilustração</span>
              </div>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl" aria-label="Destaques dos kits">
            {stats.map((s, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface px-2 py-3 text-center shadow-soft sm:px-4">
                <p className="font-display text-lg font-extrabold leading-none sm:text-2xl">{s.value}</p>
                <p className="mt-1 text-[11px] font-semibold leading-tight text-muted sm:text-sm">{s.label}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
