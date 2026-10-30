"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Price } from "@/components/ui/Price";
import type { ProductVariant } from "@/types/catalog";

type Props = {
  product: { id: string; name: string; sku: string; category: string; priceCents: number; listPriceCents: number | null; variants: ProductVariant[]; stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER" };
  slug: string;
};

export default function ProductBuyBox({ product, slug }: Props) {
  const cart = useCart();
  const variants = product.variants.filter((v) => v.available && v.stockQuantity > 0);
  const dimensions = useMemo(() => {
    const options = [...new Set(variants.flatMap((v) => v.options.map((o) => o.name)))];
    return options.length > 0 ? options : variants.length > 1 ? ["Variação"] : [];
  }, [variants]);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const selected = variants.find((v) => dimensions.every((d) => d === "Variação" ? chosen[d] === v.label : v.options.some((o) => o.name === d && chosen[d] === o.value))) ?? (dimensions.length === 0 ? variants[0] : undefined);
  const price = selected?.priceCents ?? product.priceCents;
  const list = selected?.listPriceCents ?? product.listPriceCents;
  const soldOut = product.stockStatus === "OUT_OF_STOCK" || (product.variants.length > 0 && variants.length === 0);
  const values = (name: string) => name === "Variação" ? variants.map((v) => v.label) : [...new Set(variants.flatMap((v) => v.options.filter((o) => o.name === name).map((o) => o.value)))];

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
    <div className="mt-6 rounded-card border border-line bg-surface p-5 shadow-soft">
      {product.variants.length > 0 && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">A partir de</p>}
      <Price priceCents={price} listPriceCents={list} size="lg" />
      {product.variants.length > 0 && (
        <div className="mt-5 space-y-4">
          {selected?.imageUrl && <div className="flex items-center gap-3 rounded-xl bg-bg p-3"><img src={selected.imageUrl} alt={selected.label} className="h-16 w-16 rounded-lg object-cover"/><span className="text-xs text-muted">Imagem da opção selecionada</span></div>}
          {dimensions.map((dimension) => (
            <label key={dimension} className="block">
              <span className="mb-2 block text-sm font-bold text-ink">{dimension}: <span className="font-medium text-muted">{chosen[dimension] || "Selecione"}</span></span>
              <select
                value={chosen[dimension] ?? ""}
                onChange={(e) => setChosen((old) => ({ ...old, [dimension]: e.target.value }))}
                className="input"
              >
                <option value="">Selecione {dimension.toLowerCase()}</option>
                {values(dimension).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          ))}
          {selected ? (
            <div className="rounded-xl bg-bg p-3 text-xs text-muted">
              <p className="font-bold text-ink">{selected.label}</p>
              <p>SKU: {selected.sku} · {selected.stockQuantity} disponível(is)</p>
            </div>
          ) : <p className="text-xs font-semibold text-warning">Selecione todas as opções para continuar.</p>}
        </div>
      )}
      {soldOut ? (
        <p className="mt-4 rounded-xl bg-ink/5 py-3 text-center font-bold">Produto indisponível no momento</p>
      ) : (
        <button type="button" onClick={add} disabled={product.variants.length > 0 && !selected} className="btn-primary mt-4 w-full disabled:opacity-50">
          {selected || product.variants.length === 0 ? "Adicionar ao carrinho" : "Selecione tamanho/cor"}
        </button>
      )}
      <p className="mt-3 text-center text-xs text-muted">Pagamento via PIX. Frete e prazo calculados conforme as regras da loja.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
        <div className="rounded-xl bg-white p-3">Compra protegida</div>
        <div className="rounded-xl bg-white p-3">Acompanhe seu pedido</div>
      </div>
    </div>
  );
}
