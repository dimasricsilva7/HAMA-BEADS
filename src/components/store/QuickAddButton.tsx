"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { ProductVariant } from "@/types/catalog";

export type QuickAddVariant = Pick<ProductVariant, "id" | "sku" | "options" | "priceCents" | "stockQuantity" | "available">;

type ProductForQuickAdd = {
  id: string;
  name: string;
  sku: string;
  category: string;
  priceCents: number;
  variants: QuickAddVariant[];
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER" | string;
};

function normalizeDimension(name: string) {
  const value = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  return value === "cor" || value === "color" || value === "colour" || value === "colorway" ? "color" : value;
}

export function QuickAddButton({ product, className = "" }: { product: ProductForQuickAdd; className?: string }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const available = useMemo(
    () => product.variants.filter((variant) => variant.available && variant.stockQuantity > 0),
    [product.variants]
  );
  const dimensions = useMemo(
    () => [...new Set(product.variants.flatMap((variant) => variant.options.map((option) => option.name)))],
    [product.variants]
  );
  const required = dimensions.filter((dimension) =>
    normalizeDimension(dimension) !== "color" &&
    new Set(product.variants.flatMap((variant) => variant.options.filter((option) => option.name === dimension).map((option) => option.value))).size > 1
  );
  const selected = available.find((variant) => required.every((dimension) =>
    Boolean(chosen[dimension]) && variant.options.some((option) => option.name === dimension && option.value === chosen[dimension])
  )) ?? (required.length === 0 ? available[0] : undefined);

  const add = (variant?: QuickAddVariant) => {
    if (product.variants.length > 0 && !variant) return;
    cart.add({
      id: product.id,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      priceCents: variant?.priceCents ?? product.priceCents,
      category: product.category,
      variantId: variant?.id ?? null,
    }, { element: "quick_add_card" });
    setOpen(false);
  };

  const openOrAdd = () => {
    if (product.stockStatus === "OUT_OF_STOCK" || (product.variants.length > 0 && available.length === 0)) return;
    if (required.length > 0) {
      const first = available[0];
      setChosen(Object.fromEntries(required.map((dimension) => [
        dimension,
        first?.options.find((option) => option.name === dimension)?.value ?? "",
      ])));
      setOpen(true);
      return;
    }
    add(selected);
  };

  const valuesFor = (dimension: string) => [...new Set(product.variants.flatMap((variant) =>
    variant.options.filter((option) => option.name === dimension).map((option) => option.value)
  ))];

  const canChoose = (dimension: string, value: string) => available.some((variant) =>
    variant.options.some((option) => option.name === dimension && option.value === value) &&
    required.every((other) => other === dimension || !chosen[other] ||
      variant.options.some((option) => option.name === other && option.value === chosen[other]))
  );

  const soldOut = product.stockStatus === "OUT_OF_STOCK" || (product.variants.length > 0 && available.length === 0);

  return (
    <>
      <button type="button" onClick={openOrAdd} disabled={soldOut}
        className={`mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#222] px-3 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#84bd45] hover:text-[#17230d] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
        {soldOut ? "Indisponível" : "Adicionar ao carrinho"}
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-label={`Selecionar opções de ${product.name}`}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#639b35]">Adição rápida</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#222]">{product.name}</h3>
                <p className="mt-1 text-xs text-[#666]">Todos os tamanhos do catálogo são exibidos. Os tamanhos sem estoque ficam indisponíveis para compra.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar seleção"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f2f2f2] text-xl text-[#333]">×</button>
            </div>
            <div className="mt-5 space-y-5">
              {required.map((dimension) => (
                <fieldset key={dimension}>
                  <legend className="mb-2 text-sm font-bold text-[#222]">{dimension}</legend>
                  <div className="flex flex-wrap gap-2">
                    {valuesFor(dimension).map((value) => {
                      const active = chosen[dimension] === value;
                      return (
                        <button key={value} type="button" disabled={!canChoose(dimension, value)}
                          aria-pressed={active} onClick={() => setChosen((old) => ({ ...old, [dimension]: value }))}
                          className={`min-h-10 min-w-12 border px-3 text-sm font-bold transition ${active ? "border-[#222] bg-[#222] text-white" : "border-[#dedede] bg-white text-[#222] hover:border-[#888]"} disabled:cursor-not-allowed disabled:opacity-30`}>
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#e8e8e8] pt-4">
              <span className="text-base font-extrabold text-[#4f9825]">
                {((selected?.priceCents ?? product.priceCents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              <button type="button" onClick={() => add(selected)} disabled={!selected}
                className="min-h-11 rounded-full bg-[#84bd45] px-5 text-xs font-extrabold uppercase text-[#18220f] transition hover:bg-[#76aa3e] disabled:cursor-not-allowed disabled:opacity-40">
                Confirmar e adicionar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
