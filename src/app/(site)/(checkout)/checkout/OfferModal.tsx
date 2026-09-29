"use client";

import Image from "next/image";
import { useEffect } from "react";
import { LedBoard } from "@/components/ui/LedBoard";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { formatBRL } from "@/utils/format";
import type { QuoteBump } from "@/types/catalog";

/**
 * Oferta em destaque antes de gerar o PIX. Recusar é tão fácil quanto aceitar
 * (sem dark patterns): o pedido segue normalmente com um toque em "Não, obrigado".
 */
export function OfferModal({ bump, busy, onAccept, onDecline }: { bump: QuoteBump; busy: boolean; onAccept: () => void; onDecline: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDecline();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onDecline]);

  const isLed = /led/i.test(bump.productName);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="offer-title">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-md animate-slideup overflow-hidden rounded-t-[2rem] bg-surface shadow-lift sm:animate-pop sm:rounded-[2rem]">
        <div className="relative">
          {bump.imageUrl ? (
            <div className="relative aspect-[4/3] bg-bg">
              <Image src={bump.imageUrl} alt={bump.productName} fill sizes="448px" className="object-cover" />
            </div>
          ) : isLed ? (
            <LedBoard className="aspect-[4/3]" sprite="star" sizes="448px" />
          ) : (
            <ProductVisual name={bump.productName} category="PEGBOARD" className="aspect-[4/3]" sizes="448px" />
          )}
          {bump.discountPct ? (
            <span className="absolute left-4 top-4 rotate-[-4deg] rounded-xl bg-accent px-3 py-1.5 font-display text-xl font-extrabold text-white shadow-pixel-sm">-{bump.discountPct}%</span>
          ) : null}
        </div>
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <p className="eyebrow text-accent">Oferta exclusiva deste pedido</p>
          <h2 id="offer-title" className="mt-1 font-display text-2xl font-extrabold leading-tight">
            {bump.modalTitle || bump.title}
          </h2>
          {bump.description && <p className="mt-2 text-muted">{bump.description}</p>}
          <div className="mt-4 flex items-baseline gap-3">
            {bump.listPriceCents && <s className="text-muted">{formatBRL(bump.listPriceCents)}</s>}
            <span className="font-display text-4xl font-extrabold text-success">{formatBRL(bump.priceCents)}</span>
          </div>
          {bump.benefit && <p className="mt-1 text-sm font-semibold text-accent">{bump.benefit}</p>}
          <p className="mt-1 text-xs text-muted">Entra no mesmo PIX do seu pedido.</p>
          <button type="button" onClick={onAccept} disabled={busy} data-cta="bump_modal_accept" className="btn-primary mt-5 w-full">
            Sim, quero por {formatBRL(bump.priceCents)}
          </button>
          <button type="button" onClick={onDecline} disabled={busy} data-cta="bump_modal_reject" className="btn-ghost mt-1 w-full text-muted">
            Não, obrigado — continuar sem a oferta
          </button>
        </div>
      </div>
    </div>
  );
}
