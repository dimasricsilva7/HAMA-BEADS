"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { ProductVariant } from "@/types/catalog";

export type QuickAddVariant = Pick<ProductVariant, "id" | "sku" | "options" | "priceCents" | "stockQuantity" | "available">;

type ProductForQuickAdd = {
  id: string;
  slug: string;
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
    if (required.length > 0) {
      // Mesmo sem estoque online, mostra todas as numerações do catálogo e
      // permite abrir a página para consultar a disponibilidade.
      const first = available[0] ?? product.variants[0];
      setChosen(Object.fromEntries(required.map((dimension) => [
        dimension,
        first?.options.find((option) => option.name === dimension)?.value ?? "",
      ])));
      setOpen(true);
      return;
    }
    if (product.stockStatus === "OUT_OF_STOCK" || (product.variants.length > 0 && available.length === 0)) return;
    add(selected);
  };

  const valuesFor = (dimension: string) => [...new Set(product.variants.flatMap((variant) =>
    variant.options.filter((option) => option.name === dimension).map((option) => option.value)
  ))];

  const canChoose = (dimension: string, value: string) => product.variants.some((variant) =>
    variant.options.some((option) => option.name === dimension && option.value === value) &&
    required.every((other) => other === dimension || !chosen[other] ||
      variant.options.some((option) => option.name === other && option.value === chosen[other]))
  );

  const soldOut = product.stockStatus === "OUT_OF_STOCK" || (product.variants.length > 0 && available.length === 0);

  return (
    <>
      <button type="button" onClick={openOrAdd} disabled={soldOut && required.length === 0}
        className={`mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#222] px-3 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#84bd45] hover:text-[#17230d] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
        {soldOut ? (required.length > 0 ? "Ver tamanhos" : "Indisponível") : "Adicionar ao carrinho"}
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
                <p className="mt-1 text-xs text-[#666]">Todos os tamanhos do catálogo são exibidos. Escolha um tamanho para adicionar ou consultar na página do produto.</p>
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
                      const inStock = available.some((variant) =>
                        variant.options.some((option) => option.name === dimension && option.value === value) &&
                        required.every((other) => other === dimension || !chosen[other] ||
                          variant.options.some((option) => option.name === other && option.value === chosen[other]))
                      );
                      return (
                        <button key={value} type="button" disabled={!canChoose(dimension, value)}
                          aria-pressed={active} onClick={() => setChosen((old) => ({ ...old, [dimension]: value }))}
                          title={inStock ? "Disponível para compra" : "Consulte este tamanho na página do produto"}
                          className={`min-h-10 min-w-12 border px-3 py-1 text-sm font-bold transition ${active ? "border-[#222] bg-[#222] text-white" : inStock ? "border-[#dedede] bg-white text-[#222] hover:border-[#888]" : "border-dashed border-[#b9b9b9] bg-[#fafafa] text-[#777]"} disabled:cursor-not-allowed disabled:opacity-30`}>
                          <span className="block">{value}</span>
                          {!inStock && <span className="block text-[8px] font-semibold uppercase tracking-wide">Consulta</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e8e8] pt-4">
              <Link href={"/produto/" + product.slug} className="text-xs font-bold text-[#4f9825] underline underline-offset-2">
                Ver produto e consultar tamanhos
              </Link>
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
