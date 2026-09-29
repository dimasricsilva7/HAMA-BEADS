"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { formatBRL } from "@/utils/format";
import { trackOnce } from "@/lib/client/tracking";

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-xl border-2 border-line bg-surface" role="group" aria-label={`Quantidade de ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} className="grid h-10 w-10 place-items-center text-lg font-bold disabled:opacity-30" aria-label="Diminuir">
        −
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 10} className="grid h-10 w-10 place-items-center text-lg font-bold disabled:opacity-30" aria-label="Aumentar">
        +
      </button>
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const q = cart.quote;

  useEffect(() => {
    if (!cart.drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.closeDrawer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cart.drawerOpen, cart]);

  useEffect(() => {
    if (cart.drawerOpen && q?.crossSells.length) q.crossSells.forEach((p) => trackOnce(`xs:${p.id}`, "cross_sell_view", { productId: p.id, element: "drawer" }));
  }, [cart.drawerOpen, q]);

  if (!cart.drawerOpen) return null;
  const lines = q?.lines.filter((l) => l.kind !== "ORDER_BUMP") ?? [];

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Seu carrinho">
      <button className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={cart.closeDrawer} aria-label="Fechar carrinho" />
      <div ref={panelRef} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-full max-w-[440px] animate-slidein flex-col bg-bg shadow-lift outline-none">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-display text-xl font-extrabold">Seu pedido</p>
          <button onClick={cart.closeDrawer} className="grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5" aria-label="Fechar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!cart.items.length ? (
            <div className="py-16 text-center">
              <p className="font-bold">Seu carrinho está vazio.</p>
              <Link href="/#kits" onClick={cart.closeDrawer} className="btn-primary mt-6">
                Escolher meu kit
              </Link>
            </div>
          ) : !q ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5" />
              ))}
            </div>
          ) : (
            <>
              {q.removed.length > 0 && (
                <p className="mb-3 rounded-xl bg-warning/10 px-3 py-2 text-sm text-ink">Removemos itens indisponíveis: {q.removed.join(", ")}.</p>
              )}
              <ul className="space-y-3">
                {lines.map((l, i) => (
                  <li key={l.productId} className={`flex gap-3 rounded-2xl bg-surface p-3 shadow-soft ${cart.lastAdded === l.productId ? "animate-pop ring-2 ring-success" : ""}`}>
                    <ProductVisual imageUrl={l.imageUrl} name={l.name} category={l.category} index={i} className="h-20 w-20 shrink-0 rounded-xl" sizes="80px" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-tight">{l.name}</p>
                      <p className="mt-0.5 text-sm text-muted">{formatBRL(l.unitPriceCents)}{l.quantity > 1 ? " cada" : ""}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {l.fulfillment === "DIGITAL" ? <span className="text-xs font-semibold text-muted">Produto digital</span> : <QtyStepper value={l.quantity} onChange={(n) => cart.setQuantity(l.productId, n)} label={l.name} />}
                        <button onClick={() => cart.remove(l.productId)} className="min-h-[40px] px-2 text-sm font-semibold text-muted underline-offset-2 hover:underline">
                          Remover
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {q.crossSells.length > 0 && (
                <section className="mt-6">
                  <p className="font-display text-lg font-extrabold">Complete seu kit</p>
                  <ul className="mt-3 space-y-2">
                    {q.crossSells.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
                        <ProductVisual imageUrl={p.imageUrl} name={p.name} category={p.category} index={i + 2} className="h-14 w-14 shrink-0 rounded-xl" sizes="56px" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-tight">{p.name}</p>
                          <p className="text-sm text-muted">{formatBRL(p.priceCents)}</p>
                        </div>
                        <button
                          onClick={() => cart.add({ id: p.id, name: p.name, sku: p.sku, priceCents: p.priceCents, category: p.category }, { source: "cross_sell", open: true, element: "drawer_cross_sell" })}
                          className="min-h-[44px] rounded-xl bg-ink px-3 text-sm font-bold text-white"
                          aria-label={`Adicionar ${p.name}`}
                        >
                          + Adicionar
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
          {cart.error && (
            <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {cart.error}{" "}
              <button onClick={cart.refresh} className="font-bold underline">
                Tentar novamente
              </button>
            </p>
          )}
        </div>

        {q && lines.length > 0 && (
          <footer className="border-t border-line bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatBRL(q.lines.filter((l) => l.kind !== "ORDER_BUMP").reduce((s, l) => s + l.totalCents, 0))}</span>
            </div>
            <Link href="/checkout" onClick={cart.closeDrawer} data-cta="drawer_checkout" className={`btn-primary mt-3 w-full ${cart.loading ? "opacity-80" : ""}`}>
              Finalizar compra
            </Link>
            <button onClick={cart.closeDrawer} className="btn-ghost mt-1 w-full">
              Continuar escolhendo
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
