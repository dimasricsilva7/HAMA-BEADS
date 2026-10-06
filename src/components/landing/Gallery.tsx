"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/client/tracking";

export type GalleryCard = { id: string; title: string; category: string; imageUrl: string; alt: string };

const isPlaceholder = (url: string) => url.startsWith("/placeholders/");

export function Lightbox({ item, onClose, cta }: { item: GalleryCard; onClose: () => void; cta?: { label: string; href: string; element: string } }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={item.title}>
      <button className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} aria-label="Fechar" />
      <div className="relative w-full max-w-lg animate-slideup overflow-hidden rounded-t-[2rem] bg-surface sm:animate-pop sm:rounded-[2rem]">
        <div className="relative aspect-square bg-bg">
          <Image src={item.imageUrl} alt={item.alt || item.title} fill sizes="(min-width: 640px) 512px, 100vw" className="object-contain" unoptimized={isPlaceholder(item.imageUrl)} />
        </div>
        <div className="flex items-center justify-between gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div>
            <p className="eyebrow text-primary">{item.category}</p>
            <p className="font-display text-2xl font-extrabold">{item.title}</p>
          </div>
          <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {cta && (
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <a href={cta.href} onClick={onClose} data-cta={cta.element} className="btn-primary w-full">
              {cta.label}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function Gallery({ title, subtitle, items, ctaLabel, ctaTarget }: { title: string | null; subtitle: string | null; items: GalleryCard[]; ctaLabel?: string | null; ctaTarget?: string | null }) {
  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<GalleryCard | null>(null);
  const [showAll, setShowAll] = useState(false);
  const filtered = filter ? items.filter((i) => i.category === filter) : items;
  const visible = showAll ? filtered : filtered.slice(0, 8);
  if (!items.length) return null;

  return (
    <section id="galeria" className="section bg-surface">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          {title && <h2 className="h-section mt-2">{title}</h2>}
          {subtitle && <p className="lead mt-3">{subtitle}</p>}
        </div>
        <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:justify-center" role="tablist" aria-label="Categorias">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              role="tab"
              aria-selected={filter === c}
              onClick={() => {
                setFilter(c);
                setShowAll(false);
                track("gallery_interaction", { element: "gallery_filter", props: { category: c ?? "Todas" } });
              }}
              className={`min-h-[40px] shrink-0 rounded-full border-2 px-4 text-sm font-bold transition ${filter === c ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink"}`}
            >
              {c ?? "Todas"}
            </button>
          ))}
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => {
                  setOpen(it);
                  track("gallery_open", { element: "gallery_item", props: { item: it.title, category: it.category } });
                }}
                className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-bg ring-1 ring-line transition active:scale-[0.98]"
                aria-label={`Ampliar ${it.title}`}
              >
                <Image src={it.imageUrl} alt={it.alt || it.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition duration-300 group-hover:scale-105" unoptimized={isPlaceholder(it.imageUrl)} />
                <span className="absolute inset-x-2 bottom-2 truncate rounded-xl bg-surface/90 px-2.5 py-1.5 text-left text-xs font-bold backdrop-blur">{it.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {filtered.length > 8 && !showAll && (
          <div className="mt-6 text-center">
            <button onClick={() => setShowAll(true)} className="btn-light">
              Ver mais criações
            </button>
          </div>
        )}
        {ctaLabel && (
          <div className="mt-8 text-center">
            <a href={ctaTarget || "#kits"} data-cta="gallery_cta" className="btn-primary">
              {ctaLabel}
            </a>
          </div>
        )}
      </div>
      {open && <Lightbox item={open} onClose={() => setOpen(null)} cta={{ label: "Quero criar assim", href: "#kits", element: "gallery_lightbox_cta" }} />}
    </section>
  );
}

export function Inspiration({ title, subtitle, ctaLabel, ctaTarget, items }: { title: string | null; subtitle: string | null; ctaLabel: string; ctaTarget: string; items: GalleryCard[] }) {
  const [open, setOpen] = useState<GalleryCard | null>(null);
  if (!items.length) return null;
  return (
    <section className="section overflow-hidden">
      <div className="container-page">
        <div className="max-w-2xl">
          {title && <h2 className="h-section mt-2">{title}</h2>}
          {subtitle && <p className="lead mt-3">{subtitle}</p>}
        </div>
      </div>
      <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        {items.map((it, i) => (
          <li key={it.id} className="w-[42%] shrink-0 snap-start sm:w-56">
            <button
              onClick={() => {
                setOpen(it);
                track("inspiration_open", { element: "inspiration_card", props: { item: it.title, category: it.category } });
                track("gallery_interaction", { element: "inspiration_card", props: { item: it.title } });
              }}
              className={`group block w-full overflow-hidden rounded-card border-2 border-ink bg-surface text-left shadow-pixel-sm transition active:translate-y-[2px] active:shadow-none ${i % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"}`}
            >
              <span className="relative block aspect-square bg-bg">
                <Image src={it.imageUrl} alt={it.alt || it.title} fill sizes="224px" className="object-cover" unoptimized={isPlaceholder(it.imageUrl)} />
              </span>
              <span className="block px-3 py-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{it.category}</span>
                <span className="block font-extrabold">{it.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && <Lightbox item={open} onClose={() => setOpen(null)} cta={{ label: ctaLabel, href: ctaTarget, element: "inspiration_cta" }} />}
    </section>
  );
}
