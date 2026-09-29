"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#kits", label: "Kits" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#galeria", label: "Galeria" },
  { href: "/#modelos", label: "Modelos" },
  { href: "/loja", label: "Loja" },
  { href: "/#faq", label: "Dúvidas" },
  { href: "/acompanhar", label: "Acompanhar pedido" },
];

export function Header({ storeName, logoUrl, ctaLabel, announcement }: { storeName: string; logoUrl: string | null; ctaLabel: string; announcement: string | null }) {
  const cart = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      {announcement && <div className="bg-ink px-4 py-2 text-center text-xs font-semibold text-white">{announcement}</div>}
      <header className={`sticky top-0 z-50 transition-colors ${scrolled ? "border-b border-line bg-bg/90 backdrop-blur" : "bg-bg"}`}>
        <div className="container-page flex h-14 items-center gap-3 sm:h-16">
          <button onClick={() => setOpen(true)} className="-ml-2 grid h-11 w-11 place-items-center rounded-full lg:hidden" aria-label="Abrir menu" aria-expanded={open}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <Link href="/" className="mr-auto lg:mr-6" aria-label={`${storeName} — início`}>
            <Logo name={storeName} logoUrl={logoUrl} />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5 hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/#kits" data-cta="header_cta" className="hidden min-h-[44px] items-center rounded-xl bg-primary px-4 text-sm font-extrabold uppercase text-white shadow-pixel-sm active:translate-y-[2px] active:shadow-none sm:inline-flex">
            {ctaLabel}
          </Link>
          <button onClick={cart.openDrawer} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5" aria-label={`Carrinho, ${cart.count} ${cart.count === 1 ? "item" : "itens"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z" /><path d="M9 7V6a3 3 0 0 1 6 0v1" /></svg>
            {cart.count > 0 && (
              <span key={cart.count} className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-white">
                {cart.count}
              </span>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs animate-rise flex-col bg-bg p-4 shadow-lift">
            <div className="flex items-center justify-between">
              <Logo name={storeName} logoUrl={logoUrl} />
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full" aria-label="Fechar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <nav className="mt-6 flex flex-col" aria-label="Menu">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-lg font-bold">
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href="/#kits" onClick={() => setOpen(false)} data-cta="menu_cta" className="btn-primary mt-auto w-full">
              {ctaLabel}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
