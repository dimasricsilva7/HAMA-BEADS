"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Price } from "@/components/ui/Price";
import type { ProductVariant } from "@/types/catalog";

type Props = {
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    priceCents: number;
    listPriceCents: number | null;
    variants: ProductVariant[];
    stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  };
  slug: string;
};

function normalizeOption(name: string) {
  const value = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (value.includes("tamanho") || value === "size") return "size";
  if (value === "cor" || value === "color" || value === "colour") return "color";
  return "other";
}
function colorHex(value: string) {
  const v = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/white|branco|off white|snow|cream|ivory/.test(v)) return "#f7f4e9";
  if (/black|preto|noir/.test(v)) return "#171717";
  if (/navy|marinho|blue|azul|teal/.test(v)) return "#2874b8";
  if (/pink|rosa|rose/.test(v)) return "#e88da9";
  if (/red|vermelho/.test(v)) return "#c33a42";
  if (/green|verde|olive|oliva/.test(v)) return "#6a8d43";
  if (/yellow|amarelo|gold/.test(v)) return "#e6c64f";
  if (/purple|roxo|lilac|lavender/.test(v)) return "#9b80b9";
  if (/brown|marrom|chocolate/.test(v)) return "#8c5a3c";
  if (/grey|gray|cinza|slate/.test(v)) return "#888b8e";
  if (/beige|bege|sand|areia|khaki/.test(v)) return "#c8b994";
  return "#c8c8c8";
}

export default function ProductBuyBox({ product, slug }: Props) {
  const cart = useCart();
  const variants = product.variants.filter((v) => v.available && v.stockQuantity > 0);
  const dimensions = useMemo(() => [...new Set(variants.flatMap((v) => v.options.map((o) => o.name)))], [variants]);
  const sizeDimension = dimensions.find((name) => normalizeOption(name) === "size");
  const colorDimension = dimensions.find((name) => normalizeOption(name) === "color");
  const otherDimensions = dimensions.filter((name) => name !== sizeDimension && name !== colorDimension);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const selected = variants.find((variant) => dimensions.every((dimension) =>
    Boolean(chosen[dimension]) && variant.options.some((option) => option.name === dimension && option.value === chosen[dimension])
  )) ?? (dimensions.length === 0 ? variants[0] : undefined);
  const price = selected?.priceCents ?? product.priceCents;
  const list = selected?.listPriceCents ?? product.listPriceCents;
  const soldOut = product.stockStatus === "OUT_OF_STOCK" || (product.variants.length > 0 && variants.length === 0);
  const values = (dimension: string) => [...new Set(variants.flatMap((variant) => variant.options.filter((option) => option.name === dimension).map((option) => option.value)))];
  const availableOption = (dimension: string, value: string) => variants.some((variant) =>
    variant.options.some((option) => option.name === dimension && option.value === value) &&
    dimensions.every((other) => other === dimension || !chosen[other] || variant.options.some((option) => option.name === other && option.value === chosen[other]))
  );
  const colorVariant = (value: string) => variants.find((variant) => variant.options.some((option) => option.name === colorDimension && option.value === value));

  function add() {
    if (product.variants.length && !selected) return;
    cart.add({
      id: product.id,
      name: product.name,
      sku: selected?.sku ?? product.sku,
      priceCents: price,
      category: product.category,
      variantId: selected?.id ?? null,
    }, { element: `pdp_${slug}` });
  }

  return (
    <div className="mt-6 border border-[#e4e4e4] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        {list && list > price && <span className="text-sm text-[#777] line-through">{(list / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>}
        <Price priceCents={price} listPriceCents={list} size="lg" />
      </div>
      {list && list > price && <p className="mt-1 text-xs font-bold text-[#65a900]">{Math.round((1 - price / list) * 100)}% de desconto</p>}

      {colorDimension && (
        <section className="mt-6" aria-label="Escolha da cor">
          <div className="mb-3 flex items-center gap-2 text-sm"><b>Cor:</b><span className="text-[#555]">{chosen[colorDimension] || "Selecione"}</span></div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {values(colorDimension).map((value) => {
              const variant = colorVariant(value);
              const active = chosen[colorDimension] === value;
              const enabled = availableOption(colorDimension, value);
              return (
                <button key={value} type="button" title={value} aria-label={`Cor ${value}`} aria-pressed={active} disabled={!enabled}
                  onClick={() => setChosen((old) => ({ ...old, [colorDimension]: value }))}
                  className={`group relative aspect-square overflow-hidden border bg-white transition ${active ? "border-[#292929] ring-1 ring-[#292929]" : "border-[#e5e5e5] hover:border-[#999]"} disabled:cursor-not-allowed disabled:opacity-30`}>
                  {variant?.imageUrl ? <Image src={variant.imageUrl} alt="" fill sizes="76px" className="object-contain p-1" /> : <span className="absolute inset-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex(value) }} />}
                  {active && <span className="absolute bottom-0 left-0 right-0 bg-[#222] px-1 py-1 text-[9px] font-bold text-white">SELECIONADA</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {sizeDimension && (
        <section className="mt-6" aria-label="Escolha do tamanho">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm"><span><b>{sizeDimension}:</b> <span className="text-[#555]">{chosen[sizeDimension] || "Selecione"}</span></span><span className="text-xs font-semibold text-[#555]">Tabela de medidas</span></div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {values(sizeDimension).map((value) => {
              const active = chosen[sizeDimension] === value;
              const enabled = availableOption(sizeDimension, value);
              return <button key={value} type="button" aria-pressed={active} disabled={!enabled}
                onClick={() => setChosen((old) => ({ ...old, [sizeDimension]: value }))}
                className={`min-h-11 border px-2 text-sm font-bold transition ${active ? "border-[#292929] bg-[#292929] text-white" : "border-[#e2e2e2] bg-white text-[#222] hover:border-[#777]"} disabled:cursor-not-allowed disabled:opacity-30`}>{value}</button>;
            })}
          </div>
        </section>
      )}

      {otherDimensions.map((dimension) => (
        <label key={dimension} className="mt-5 block">
          <span className="mb-2 block text-sm font-bold">{dimension}: <span className="font-normal text-[#666]">{chosen[dimension] || "Selecione"}</span></span>
          <select value={chosen[dimension] ?? ""} onChange={(event) => setChosen((old) => ({ ...old, [dimension]: event.target.value }))}
            className="min-h-12 w-full border border-[#dedede] bg-white px-3 text-sm">
            <option value="">Selecione {dimension.toLowerCase()}</option>
            {values(dimension).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      ))}

      {selected ? <p className="mt-4 text-xs text-[#666]">SKU: {selected.sku} · {selected.stockQuantity} disponível(is)</p>
        : product.variants.length > 0 ? <p className="mt-4 text-xs font-semibold text-[#b56a00]">Selecione todas as opções para continuar.</p> : null}

      {soldOut ? <p className="mt-5 border border-[#e5e5e5] bg-[#f7f7f7] py-3 text-center text-sm font-bold">Produto indisponível no momento</p> :
        <button type="button" onClick={add} disabled={product.variants.length > 0 && !selected}
          className="mt-5 min-h-14 w-full bg-[#84BD00] px-5 text-sm font-extrabold uppercase tracking-wide text-[#172000] transition hover:bg-[#72a900] disabled:cursor-not-allowed disabled:opacity-45">
          {selected || product.variants.length === 0 ? "Adicionar ao carrinho" : "Selecione tamanho/cor"}
        </button>}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e6e6e6] pt-4 text-xs text-[#555]">
        <div className="flex items-center gap-2"><span className="text-[#639b00]">✓</span> Compra protegida</div>
        <div className="flex items-center gap-2"><span className="text-[#639b00]">✓</span> Acompanhe seu pedido</div>
      </div>
      <p className="mt-4 text-center text-[11px] leading-5 text-[#777]">Loja independente. Produto da marca Crocs; consulte as condições de venda e atendimento desta loja.</p>
    </div>
  );
}
