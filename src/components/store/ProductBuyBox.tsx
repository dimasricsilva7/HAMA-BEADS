"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Price } from "@/components/ui/Price";
import { crocsColorBackground, isColorOption } from "@/lib/crocs-colors";
import { resizeVtexImage } from "@/lib/vtex-image";
import type { ProductVariant, ProductColorFamilyItem } from "@/types/catalog";

type JibbitzOption = { id: string; name: string; sku: string; priceCents: number; imageUrl: string | null; variantId: string | null };

type Props = {
  jibbitzProducts: JibbitzOption[];
  productJibbitzTitle: string;
  productJibbitzDescription: string;
  productResellerNote: string;
  whatsapp: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    priceCents: number;
    listPriceCents: number | null;
    variants: ProductVariant[];
    stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER";
    colorFamily: ProductColorFamilyItem[];
  };
  slug: string;
};

function normalizeOption(name: string) {
  const value = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (value.includes("tamanho") || value === "size") return "size";
  if (isColorOption(name)) return "color";
  return "other";
}

export default function ProductBuyBox({ product, slug, jibbitzProducts, productJibbitzTitle, productJibbitzDescription, productResellerNote, whatsapp }: Props) {
  const cart = useCart();
  const variants = product.variants;
  const purchasable = variants.filter((variant) => variant.available && variant.stockQuantity > 0);
  const dimensions = useMemo(
    () => [...new Set(variants.flatMap((variant) => variant.options.map((option) => option.name)))],
    [variants]
  );
  const sizeDimension = dimensions.find((name) => normalizeOption(name) === "size");
  const colorDimension = dimensions.find((name) => normalizeOption(name) === "color");
  const useColorFamily = product.colorFamily.length > 0;
  const otherDimensions = dimensions.filter((name) => name !== sizeDimension && name !== colorDimension);
  const selectionDimensions = dimensions.filter((name) => !useColorFamily || name !== colorDimension);
  const values = (dimension: string) => [...new Set(variants.flatMap((variant) =>
    variant.options.filter((option) => option.name === dimension).map((option) => option.value)
  ))];
  const requiredDimensions = selectionDimensions.filter((dimension) => values(dimension).length > 1);

  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [showAllColors, setShowAllColors] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedJibbitz, setSelectedJibbitz] = useState<string[]>([]);
  const selectedJibbitzItems = jibbitzProducts.filter((item) => selectedJibbitz.includes(item.id));
  const selectedJibbitzTotal = selectedJibbitzItems.reduce((sum, item) => sum + item.priceCents, 0);

  const matchesChosen = (variant: ProductVariant) => requiredDimensions.every((dimension) =>
    Boolean(chosen[dimension]) && variant.options.some((option) => option.name === dimension && option.value === chosen[dimension])
  );
  const selectedVariant = variants.find(matchesChosen) ?? (requiredDimensions.length === 0 ? variants[0] : undefined);
  const selected = purchasable.find(matchesChosen) ?? (requiredDimensions.length === 0 ? purchasable[0] : undefined);

  const price = selected?.priceCents ?? product.priceCents;
  const list = selected ? selected.listPriceCents : product.listPriceCents;
  const soldOut = product.stockStatus === "OUT_OF_STOCK" || (variants.length > 0 && purchasable.length === 0);

  const availableOption = (dimension: string, value: string) => purchasable.some((variant) =>
    variant.options.some((option) => option.name === dimension && option.value === value) &&
    requiredDimensions.every((other) =>
      other === dimension || !chosen[other] ||
      variant.options.some((option) => option.name === other && option.value === chosen[other])
    )
  );

  function add() {
    if (variants.length > 0 && !selected) return;
    if (soldOut) return;
    cart.add({
      id: product.id,
      name: product.name,
      sku: selected?.sku ?? product.sku,
      priceCents: price,
      category: product.category,
      variantId: selected?.id ?? null,
    }, { element: `pdp_${slug}`, quantity, open: false });
    for (const item of selectedJibbitzItems) {
      cart.add({ id: item.id, name: item.name, sku: item.sku, priceCents: item.priceCents, category: "JIBBITZ", variantId: item.variantId }, { element: "pdp_jibbitz", open: false });
    }
    cart.openDrawer();
    setSelectedJibbitz([]);
  }

  return (
    <div className="mt-5 bg-white">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <Price priceCents={price} listPriceCents={list} size="lg" />
      </div>
      {list && list > price && <p className="mt-1 text-xs font-bold text-[#579628]">{Math.round((1 - price / list) * 100)}% de desconto</p>}

      {useColorFamily ? (
        <section className="mt-6" aria-label="Escolha a cor">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <b>Cor:</b>
            <span className="text-[#555]">{product.colorFamily.find((item) => item.id === product.id)?.value ?? "Selecione"}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {product.colorFamily.slice(0, showAllColors ? product.colorFamily.length : 9).map((item) => (
              <Link key={`${item.id}-${item.value}`} href={`/produto/${item.slug}`} title={item.value} aria-label={`Cor ${item.value}`}
                aria-current={item.id === product.id ? "page" : undefined}
                className={`grid h-9 w-9 place-items-center rounded-full border bg-white transition ${item.id === product.id ? "border-[#222] ring-2 ring-[#222] ring-offset-2" : "border-[#ddd] hover:border-[#888]"}`}>
                <span className="relative h-6 w-6 overflow-hidden rounded-full border border-black/10 bg-white">
                  {item.imageUrl
                    ? <Image src={resizeVtexImage(item.imageUrl, 100)} alt="" fill sizes="24px" className="object-cover" />
                    : <span className="absolute inset-0" style={{ background: crocsColorBackground(item.value) }} />}
                </span>
              </Link>
            ))}
          </div>
          {product.colorFamily.length > 9 && (
            <button type="button" onClick={() => setShowAllColors((open) => !open)} aria-expanded={showAllColors}
              className="mt-2 inline-flex min-h-8 items-center rounded-full border border-[#ddd] bg-white px-3 py-1 text-xs font-bold text-[#555] transition hover:border-[#888] hover:bg-[#f7f7f7]">
              {showAllColors ? "Mostrar menos" : `+${product.colorFamily.length - 9} cores`}
            </button>
          )}
          <p className="mt-2 text-[11px] text-[#777]">{product.colorFamily.length} cores disponíveis no catálogo</p>
        </section>
      ) : colorDimension && values(colorDimension).length > 0 ? (
        <section className="mt-6" aria-label="Escolha da cor">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <b>Cor:</b><span className="text-[#555]">{chosen[colorDimension] ?? values(colorDimension)[0]}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {values(colorDimension).map((value) => {
              const active = (chosen[colorDimension] ?? values(colorDimension)[0]) === value;
              return (
                <button key={value} type="button" title={value} aria-label={`Cor ${value}`} aria-pressed={active}
                  disabled={!availableOption(colorDimension, value)}
                  onClick={() => setChosen((old) => ({ ...old, [colorDimension]: value }))}
                  className={`grid h-9 w-9 place-items-center rounded-full border bg-white transition ${active ? "border-[#222] ring-2 ring-[#222] ring-offset-2" : "border-[#ddd]"} disabled:opacity-30`}>
                  <span className="relative h-6 w-6 overflow-hidden rounded-full border border-black/10 bg-white">
                    {variants.find((variant) => variant.imageUrl && variant.options.some((option) => option.name === colorDimension && option.value === value))?.imageUrl
                      ? <Image
                          src={resizeVtexImage(variants.find((variant) => variant.imageUrl && variant.options.some((option) => option.name === colorDimension && option.value === value))!.imageUrl!, 100)}
                          alt=""
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      : <span className="absolute inset-0" style={{ background: crocsColorBackground(value) }} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {sizeDimension && values(sizeDimension).length > 0 && (
        <section className="mt-6" aria-label="Escolha do tamanho">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span><b>{sizeDimension}:</b> <span className="text-[#555]">{chosen[sizeDimension] ?? "Selecione"}</span></span>
            <span className="text-xs font-semibold text-[#555]">Guia de tamanhos</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {values(sizeDimension).map((value) => {
              const active = chosen[sizeDimension] === value;
              const exists = variants.some((variant) =>
                variant.options.some((option) => option.name === sizeDimension && option.value === value) &&
                requiredDimensions.every((other) => other === sizeDimension || !chosen[other] ||
                  variant.options.some((option) => option.name === other && option.value === chosen[other]))
              );
              const inStock = availableOption(sizeDimension, value);
              return (
                <button key={value} type="button" aria-pressed={active} disabled={!exists}
                  title={inStock ? `Tamanho ${value} disponível` : `Tamanho ${value}: consulte disponibilidade`}
                  onClick={() => setChosen((old) => ({ ...old, [sizeDimension]: value }))}
                  className={`min-h-11 border px-2 text-sm font-bold transition ${active ? "border-[#292929] bg-[#292929] text-white" : inStock ? "border-[#e2e2e2] bg-white text-[#222] hover:border-[#777]" : "border-dashed border-[#b9b9b9] bg-[#fafafa] text-[#777]"} disabled:cursor-not-allowed disabled:opacity-30`}>
                  {value}{!inStock && <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-wide">Consulta</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {otherDimensions.filter((dimension) => values(dimension).length > 1).map((dimension) => (
        <label key={dimension} className="mt-5 block">
          <span className="mb-2 block text-sm font-bold">{dimension}: <span className="font-normal text-[#666]">{chosen[dimension] || "Selecione"}</span></span>
          <select value={chosen[dimension] ?? ""} onChange={(event) => setChosen((old) => ({ ...old, [dimension]: event.target.value }))}
            className="min-h-12 w-full border border-[#dedede] bg-white px-3 text-sm">
            <option value="">Selecione {dimension.toLowerCase()}</option>
            {values(dimension).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      ))}

      {jibbitzProducts.length > 0 && (
        <section className="mt-7 border-t border-[#e7e7e7] pt-5" aria-label="Adicionar Jibbitz ao calçado">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[#222]">{productJibbitzTitle}</h2>
              <p className="mt-1 text-xs leading-5 text-[#666]">{productJibbitzDescription}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f2f6ec] px-2.5 py-1 text-[10px] font-bold text-[#477f24]">{selectedJibbitz.length}/10</span>
          </div>
          <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2">
            {jibbitzProducts.map((item) => {
              const active = selectedJibbitz.includes(item.id);
              return (
                <button key={item.id} type="button" onClick={() => setSelectedJibbitz((old) => active ? old.filter((id) => id !== item.id) : old.length >= 10 ? old : [...old, item.id])}
                  aria-pressed={active} className={`w-[116px] shrink-0 snap-start overflow-hidden rounded-xl border bg-white text-left transition ${active ? "border-[#579628] ring-2 ring-[#579628]/20" : "border-[#e5e5e5] hover:border-[#999]"}`}>
                  <span className="relative block aspect-square bg-[#fafafa]">
                    {item.imageUrl ? <Image src={resizeVtexImage(item.imageUrl, 200)} alt={item.name} fill sizes="116px" className="object-contain p-2" /> : <span className="grid h-full place-items-center text-xs text-[#777]">Jibbitz</span>}
                    <span className={`absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-black ${active ? "bg-[#579628] text-white" : "border border-[#ddd] bg-white text-[#555]"}`}>{active ? "✓" : "+"}</span>
                  </span>
                  <span className="block px-2.5 pb-2.5 pt-2">
                    <span className="block min-h-8 text-[11px] font-bold leading-4 text-[#333]">{item.name}</span>
                    <span className="mt-1 block text-xs font-extrabold text-[#579628]">{(item.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {selectedJibbitz.length > 0 && <p className="mt-2 text-xs font-semibold text-[#477f24]">{selectedJibbitz.length} Jibbitz selecionado(s) · + {(selectedJibbitzTotal / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>}
        </section>
      )}

      {!soldOut && (
        <div className="mt-5 flex items-center gap-3">
          <div className="inline-flex min-h-12 items-center border border-[#dedede]" role="group" aria-label="Quantidade">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Diminuir quantidade" className="h-12 w-11 text-lg disabled:opacity-35">−</button>
            <span className="w-9 text-center text-sm font-bold tabular-nums" aria-live="polite">{quantity}</span>
            <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} disabled={quantity >= 10} aria-label="Aumentar quantidade" className="h-12 w-11 text-lg disabled:opacity-35">+</button>
          </div>
          <span className="text-xs text-[#777]">Quantidade</span>
        </div>
      )}

      {selected ? <p className="mt-4 text-xs text-[#666]">SKU: {selected.sku}</p>
        : selectedVariant && variants.length > 0 ? <p className="mt-4 text-xs font-semibold text-[#9a6500]">Este tamanho está no catálogo, mas sem estoque confirmado. Consulte a disponibilidade antes de comprar.</p>
        : variants.length > 0 ? <p className="mt-4 text-xs font-semibold text-[#b56a00]">Selecione o tamanho para continuar.</p> : null}

      {selectedVariant && !selected ? (
        whatsapp && whatsapp.replace(/\D/g, "").length >= 10 ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "").startsWith("55") ? whatsapp.replace(/\D/g, "") : `55${whatsapp.replace(/\D/g, "")}`}?text=${encodeURIComponent(`Olá! Gostaria de consultar a disponibilidade do tamanho ${sizeDimension ? chosen[sizeDimension] : "selecionado"} do produto ${product.name}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-full bg-[#84BD00] px-5 text-sm font-extrabold uppercase tracking-wide text-[#172000] transition hover:bg-[#72a900]"
          >
            Consultar tamanho pelo WhatsApp
          </a>
        ) : <p className="mt-5 border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-center text-sm font-bold">Tamanho sob consulta. Entre em contato com a loja.</p>
      ) : soldOut ? (
        <p className="mt-5 border border-[#e5e5e5] bg-[#f7f7f7] py-3 text-center text-sm font-bold">Produto sem estoque confirmado no momento</p>
      ) : (
        <button type="button" onClick={add} disabled={variants.length > 0 && !selected}
          className="mt-5 min-h-14 w-full rounded-full bg-[#84BD00] px-5 text-sm font-extrabold uppercase tracking-wide text-[#172000] transition hover:bg-[#72a900] disabled:cursor-not-allowed disabled:opacity-45">
          Adicionar ao carrinho
        </button>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e6e6e6] pt-4 text-xs text-[#555]">
        <div className="flex items-center gap-2"><span className="text-[#639b00]">✓</span> Compra protegida</div>
        <div className="flex items-center gap-2"><span className="text-[#639b00]">✓</span> Acompanhe seu pedido</div>
      </div>
      {productResellerNote && <p className="mt-4 text-center text-[11px] leading-5 text-[#777]">{productResellerNote}</p>}
    </div>
  );
}
