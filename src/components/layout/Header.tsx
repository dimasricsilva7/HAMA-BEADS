"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Logo } from "./Logo";

const NAV = [
  { href: "/loja?colecao=111", label: "Feminino" },
  { href: "/loja?colecao=146", label: "Masculino" },
  { href: "/loja?colecao=173", label: "Kids" },
  { href: "/loja?colecao=225", label: "Crocs At Work" },
  { href: "/loja?colecao=215", label: "Jibbitz" },
  { href: "/loja?colecao=1792513037", label: "Bolsas e Acessórios" },
  { href: "/loja?colecao=595,596,599", label: "BLACK FRIDAY", emphasis: true },
];

function SearchForm({ mobile = false }: { mobile?: boolean }) {
  return <form action="/loja" method="get" className={mobile ? "flex w-full items-center gap-2 border-b border-[#e6e6e6] py-3" : "hidden h-11 w-[210px] items-center gap-2 rounded-full border border-[#d8d8d8] px-4 xl:flex xl:w-[250px]"}>
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-[#333]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
    <input name="q" type="search" placeholder="Buscar..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#777]" aria-label="Buscar produtos" />
  </form>;
}

export function Header({ storeName, logoUrl, ctaLabel, announcement }: { storeName: string; logoUrl: string | null; ctaLabel: string; announcement: string | null }) {
  const cart = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const promoText = announcement && !/loja independente|não somos a loja oficial/i.test(announcement)
    ? announcement : "BLACK NOVEMBER · Explore as ofertas disponíveis na loja";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return <>
    <div className="bg-[#171417] px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs">{promoText}</div>
    <header className={`sticky top-0 z-50 border-b border-[#eee] transition-colors ${scrolled ? "bg-white/95 shadow-sm backdrop-blur" : "bg-white"}`}>
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:h-[76px] lg:px-8">
        <button onClick={() => setOpen(true)} className="-ml-2 grid h-11 w-11 place-items-center rounded-full lg:hidden" aria-label="Abrir menu" aria-expanded={open}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <Link href="/" className="mr-auto shrink-0 lg:mr-5" aria-label={`${storeName} — início`}><Logo name={storeName} logoUrl={logoUrl} /></Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex" aria-label="Principal">
          {NAV.map((item) => <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-bold transition hover:bg-[#f4f4f4] ${item.emphasis ? "text-[#4e8e28]" : "text-[#1d1d1d]"}`}>{item.label}</Link>)}
        </nav>
        <div className="hidden lg:block"><SearchForm /></div>
        <Link href="/acompanhar" className="grid h-11 w-10 shrink-0 place-items-center rounded-full text-[#222] transition hover:bg-[#f4f4f4]" aria-label="Atendimento e acompanhamento de pedido">
          <svg viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></svg>
        </Link>
        <Link href="/loja?favoritos=1" className="grid h-11 w-10 shrink-0 place-items-center rounded-full text-[#222] transition hover:bg-[#f4f4f4]" aria-label="Meus favoritos">
          <svg viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 5.9l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
        </Link>
        <button onClick={cart.openDrawer} className="relative grid h-11 w-10 shrink-0 place-items-center rounded-full text-[#222] transition hover:bg-[#f4f4f4]" aria-label={`Carrinho, ${cart.count} ${cart.count === 1 ? "item" : "itens"}`}>
          <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
          {cart.count > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#84bd45] px-1 text-[10px] font-extrabold text-white">{cart.count}</span>}
        </button>
      </div>
    </header>
    {open && <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Fechar menu" />
      <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-rise flex-col bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e8e8e8] pb-3"><Logo name={storeName} logoUrl={logoUrl} />
          <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full" aria-label="Fechar menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button></div>
        <SearchForm mobile />
        <nav className="mt-2 flex flex-col overflow-y-auto" aria-label="Menu da loja">
          {NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-[#ededed] py-3.5 text-[15px] font-bold text-[#222]">{item.label}</Link>)}
          <Link href="/acompanhar" onClick={() => setOpen(false)} className="border-b border-[#ededed] py-3.5 text-[15px] font-bold text-[#222]">Acompanhar pedido</Link>
          <Link href="/loja?favoritos=1" onClick={() => setOpen(false)} className="border-b border-[#ededed] py-3.5 text-[15px] font-bold text-[#222]">Meus favoritos</Link>
        </nav>
        <Link href="/loja" onClick={() => setOpen(false)} data-cta="menu_cta" className="mt-auto flex min-h-12 items-center justify-center rounded-full bg-[#84bd45] px-4 text-sm font-extrabold text-[#17230d]">{ctaLabel || "Ver coleção"}</Link>
      </div>
    </div>}
  </>;
}
