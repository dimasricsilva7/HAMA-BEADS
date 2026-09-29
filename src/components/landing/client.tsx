"use client";

import { useEffect, useRef, useState } from "react";
import { useCart, type ProductRef } from "@/components/cart/CartProvider";
import { gaEvent, metaEvent, track, trackOnce } from "@/lib/client/tracking";

/** Botão de compra reutilizável (server components passam só dados serializáveis). */
export function AddToCartButton({
  product,
  label,
  element,
  className = "btn-primary w-full",
  kitSelect = false,
  source,
}: {
  product: ProductRef;
  label: string;
  element: string;
  className?: string;
  kitSelect?: boolean;
  source?: "cross_sell";
}) {
  const cart = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      data-cta={element}
      data-product={product.id}
      className={className}
      disabled={product.priceCents <= 0}
      onClick={() => {
        if (kitSelect) track("kit_selected", { productId: product.id, valueCents: product.priceCents, element });
        cart.add(product, { element, source });
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Adicionado ✓" : label}
    </button>
  );
}

/** Dispara um evento uma única vez quando o elemento fica ≥50% visível (ex.: product_view). */
export function ViewTracker({ event, productId, element, valueCents, meta, children, className }: {
  event: "product_view" | "order_bump_view" | "cross_sell_view";
  productId?: string;
  element?: string;
  valueCents?: number;
  meta?: { sku: string; name: string; priceCents: number; category?: string };
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const key = `${event}:${productId ?? element}`;
        trackOnce(key, event, { productId, element, valueCents });
        if (meta && event === "product_view") {
          metaEvent("ViewContent", { content_ids: [meta.sku], content_name: meta.name, content_type: "product", value: meta.priceCents / 100, currency: "BRL" }, { mirror: true });
          gaEvent("view_item", { currency: "BRL", value: meta.priceCents / 100, items: [{ item_id: meta.sku, item_name: meta.name, price: meta.priceCents / 100, item_category: meta.category }] });
        }
        io.disconnect();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [event, productId, element, valueCents, meta]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** landing_view + profundidade de rolagem (25/50/75/90), uma vez por página. */
export function LandingTracker() {
  useEffect(() => {
    track("landing_view");
    const fired = new Set<number>();
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const pct = (window.scrollY / h) * 100;
      for (const mark of [25, 50, 75, 90]) {
        if (pct >= mark && !fired.has(mark)) {
          fired.add(mark);
          track(`scroll_${mark}`, { props: { depth: mark } });
        }
      }
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return null;
}

/** CTA fixo no mobile: aparece depois do hero e some quando a seção de kits está na tela. */
export function StickyMobileCTA({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("inicio");
    const kits = document.getElementById("kits");
    let heroVisible = true;
    let kitsVisible = false;
    const update = () => setShow(!heroVisible && !kitsVisible);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        if (e.target === kits) kitsVisible = e.isIntersecting;
      }
      update();
    });
    if (hero) io.observe(hero);
    if (kits) io.observe(kits);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 lg:hidden ${show ? "translate-y-0" : "translate-y-full"}`} aria-hidden={!show}>
      <a href="#kits" data-cta="sticky_mobile_cta" tabIndex={show ? 0 : -1} className="btn-primary w-full">
        {label}
      </a>
    </div>
  );
}
