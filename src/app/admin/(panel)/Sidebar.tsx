"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "../login/actions";

type NavItem = { href: string; label: string; owner?: boolean; adminOnly?: boolean };
const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Visão geral", items: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/vitrines", label: "Vitrines da página inicial" },
  ] },
  { title: "Loja e catálogo", items: [
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/descontos", label: "Descontos e campanhas" },
    { href: "/admin/catalogo", label: "Importar catálogo", adminOnly: true },
  ] },
  { title: "Vendas e ofertas", items: [
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/cupons", label: "Cupons" },
    { href: "/admin/order-bumps", label: "Order bumps" },
    { href: "/admin/upsells", label: "Upsells" },
  ] },
  { title: "Pagamentos", items: [
    { href: "/admin/pix-pendentes", label: "PIX pendentes" },
    { href: "/admin/pagamentos", label: "Pagamentos" },
    { href: "/admin/pagamentos/crediario", label: "Crediário" },
  ] },
  { title: "Conteúdo da loja", items: [
    { href: "/admin/conteudo-loja", label: "Textos e banners" },
    { href: "/admin/faq", label: "Perguntas frequentes" },
    { href: "/admin/avaliacoes", label: "Avaliações" },
    { href: "/admin/galeria", label: "Galeria" },
  ] },
  { title: "Configurações", items: [
    { href: "/admin/configuracoes", label: "Configurações gerais" },
  ] },
];

const ADVANCED: NavItem[] = [
  { href: "/admin/checkouts", label: "Checkouts abandonados" },
  { href: "/admin/aquisicao", label: "Aquisição" },
  { href: "/admin/custos", label: "Custos de anúncios" },
  { href: "/admin/relatorio-produtos", label: "Relatório de produtos" },
  { href: "/admin/relatorio-ofertas", label: "Relatório de ofertas" },
  { href: "/admin/ao-vivo", label: "Clientes online" },
  { href: "/admin/funil", label: "Funil de conversão" },
  { href: "/admin/comportamento", label: "Comportamento" },
  { href: "/admin/cliques", label: "Cliques" },
  { href: "/admin/experimentos", label: "Testes A/B" },
  { href: "/admin/landing", label: "Landing pages" },
  { href: "/admin/webhooks", label: "Webhooks" },
  { href: "/admin/auditoria", label: "Auditoria" },
  { href: "/admin/usuarios", label: "Usuários", owner: true },
];

export function Sidebar({ name, email, role, storeName }: { name: string; email: string; role: string; storeName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const all = [...GROUPS.flatMap((group) => group.items), ...ADVANCED];
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || (pathname.startsWith(`${href}/`) && !all.some((item) => item.href !== href && item.href.startsWith(href) && pathname.startsWith(item.href)));
  const visible = (item: NavItem) => (!item.owner || role === "OWNER") && (!item.adminOnly || role === "ADMIN" || role === "OWNER");
  const link = (item: NavItem) => (
    <Link key={item.href} href={item.href}
      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive(item.href) ? "bg-slate-900 font-semibold text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      {item.label}
    </Link>
  );
  const brand = (
    <div className="min-w-0">
      <span className="block truncate text-sm font-extrabold tracking-tight text-slate-950">{storeName || "Painel da loja"}</span>
      <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Painel de gestão</span>
    </div>
  );
  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Administração da loja">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{group.title}</p>
          <div className="space-y-0.5">{group.items.filter(visible).map(link)}</div>
        </div>
      ))}
      <details className="group rounded-lg" open={ADVANCED.some((item) => visible(item) && isActive(item.href))}>
        <summary className="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[.14em] text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          Mais ferramentas
        </summary>
        <div className="mt-1 space-y-0.5 border-l border-slate-200 pl-2">
          {ADVANCED.filter(visible).map(link)}
        </div>
      </details>
    </nav>
  );
  const footer = (
    <div className="border-t border-slate-200 p-4">
      <p className="truncate text-sm font-medium text-slate-900">{name}</p>
      <p className="truncate text-xs text-slate-500">{email} · {role}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" target="_blank" className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50">Ver loja</Link>
        <form action={logoutAction} className="flex-1">
          <button className="w-full rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Sair</button>
        </form>
      </div>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="-ml-1 rounded-lg p-2 hover:bg-slate-100" aria-label="Abrir menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        {brand}
        <span className="w-8" />
      </div>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">{brand}</div>
        {nav}
        {footer}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center border-b border-slate-200 px-5">{brand}</div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
