"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/admin/client";
import { Badge, btnPrimary, btnSecondary, inputCls } from "@/components/admin/ui";
import type { HomeSectionKey, HomeSectionSelection } from "@/lib/home-sections";
import { saveHomeSections } from "./actions";

export type HomeVitrineCandidate = {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryLabel: string;
  imageUrl: string | null;
  priceCents: number;
  colorCount: number;
  stockStatus: string;
  sourceCollectionId: string | null;
  sourceCollectionIds: string[];
  homeBlackFriday: boolean;
  badge: string | null;
  listPriceCents: number | null;
};

const SECTIONS: { key: HomeSectionKey; label: string; description: string }[] = [
  { key: "black", label: "Ofertas Black", description: "Produtos que aparecem no carrossel da campanha." },
  { key: "kids", label: "Infantil", description: "Modelos que aparecem na vitrine Infantil." },
  { key: "adult", label: "Adulto", description: "Clogs, sandálias e slides da vitrine Adulto." },
  { key: "jibbitz", label: "Jibbitz", description: "Pins e acessórios exibidos na seção Jibbitz." },
];
const MAX_ITEMS = 10;
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function HomeVitrinesEditor({ candidates, initial }: { candidates: HomeVitrineCandidate[]; initial: HomeSectionSelection }) {
  const [active, setActive] = useState<HomeSectionKey>("black");
  const [selection, setSelection] = useState<HomeSectionSelection>(initial);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [state, formAction] = useActionState(saveHomeSections, undefined);

  const byId = useMemo(() => new Map(candidates.map((product) => [product.id, product])), [candidates]);
  const categories = useMemo(() => [...new Set(candidates.map((product) => product.categoryLabel))].sort((a, b) => a.localeCompare(b, "pt-BR")), [candidates]);
  const selected = selection[active];
  const selectedProducts = selected.map((id) => byId.get(id) ?? ({
    id, name: "Produto inativo ou indisponível", sku: "", category: "", categoryLabel: "Indisponível",
    imageUrl: null, priceCents: 0, colorCount: 0, stockStatus: "OUT_OF_STOCK",
    sourceCollectionId: null, sourceCollectionIds: [], homeBlackFriday: false, badge: null, listPriceCents: null,
  } satisfies HomeVitrineCandidate));
  const selectedSet = new Set(selected);
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("pt-BR");
    return candidates.filter((product) => {
      if (category !== "ALL" && product.categoryLabel !== category) return false;
      if (!q) return true;
      return [product.name, product.sku, product.categoryLabel].some((value) => value.toLocaleLowerCase("pt-BR").includes(q));
    });
  }, [candidates, category, search]);

  function updateSection(next: string[]) {
    setSelection((current) => ({ ...current, [active]: next.slice(0, MAX_ITEMS) }));
  }
  function add(id: string) {
    if (selectedSet.has(id) || selected.length >= MAX_ITEMS) return;
    updateSection([...selected, id]);
  }
  function move(index: number, direction: -1 | 1) {
    const next = [...selected];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateSection(next);
  }
  function remove(id: string) {
    updateSection(selected.filter((item) => item !== id));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="selection" value={JSON.stringify(selection)} />
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Escolha a vitrine para editar</h2>
            <p className="mt-1 text-xs text-slate-500">Cada vitrine aceita até {MAX_ITEMS} modelos. Um modelo com várias cores ocupa apenas um card.</p>
          </div>
          <Badge tone="blue">{candidates.length} modelos disponíveis</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {SECTIONS.map((section) => {
            const count = selection[section.key].length;
            const isActive = active === section.key;
            return (
              <button key={section.key} type="button" onClick={() => { setActive(section.key); setSearch(""); setCategory("ALL"); }}
                className={`rounded-lg border px-3 py-3 text-left transition ${isActive ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"}`}>
                <span className="block text-sm font-bold">{section.label}</span>
                <span className={`mt-1 block text-xs ${isActive ? "text-white/75" : "text-slate-500"}`}>{count} de {MAX_ITEMS} selecionados</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">{SECTIONS.find((s) => s.key === active)?.label}</h2>
                <p className="mt-1 text-xs text-slate-500">{SECTIONS.find((s) => s.key === active)?.description}</p>
              </div>
              <Badge tone={selected.length ? "green" : "amber"}>{selected.length}/{MAX_ITEMS}</Badge>
            </div>
          </header>
          <div className="p-4 sm:p-5">
            {selectedProducts.length ? (
              <ol className="space-y-2">
                {selectedProducts.map((product, index) => (
                  <li key={product.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {product.imageUrl && <Image src={product.imageUrl} alt="" fill unoptimized sizes="48px" className="object-contain" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.categoryLabel} · {product.colorCount} cor(es) · {money(product.priceCents)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover para cima" className="rounded border border-slate-200 px-2 py-0.5 text-xs disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === selectedProducts.length - 1} aria-label="Mover para baixo" className="rounded border border-slate-200 px-2 py-0.5 text-xs disabled:opacity-30">↓</button>
                    </div>
                    <button type="button" onClick={() => remove(product.id)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remover</button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-800">Nenhum produto selecionado</p>
                <p className="mt-1 text-xs text-slate-500">Adicione produtos na lista ao lado. A seção fica oculta até receber uma seleção.</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => updateSection([])} disabled={!selected.length} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40">Limpar esta vitrine</button>
              <span className="text-xs text-slate-500">A ordem acima será mantida na página inicial.</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="font-bold text-slate-900">Adicionar produtos</h2>
            <p className="mt-1 text-xs text-slate-500">Pesquise por nome, SKU ou categoria e clique em adicionar.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_190px]">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto ou SKU..." className={inputCls} />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputCls}>
                <option value="ALL">Todas as categorias</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </header>
          <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
            {filtered.slice(0, 80).map((product) => {
              const exists = selectedSet.has(product.id);
              const disabled = !exists && selected.length >= MAX_ITEMS;
              return (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {product.imageUrl && <Image src={product.imageUrl} alt="" fill unoptimized sizes="56px" className="object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="truncate text-xs text-slate-500">{product.categoryLabel} · SKU {product.sku}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">{money(product.priceCents)} · {product.colorCount} cor(es)</p>
                  </div>
                  <button type="button" onClick={() => exists ? remove(product.id) : add(product.id)} disabled={disabled}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${exists ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40"}`}>
                    {exists ? "Remover" : "Adicionar"}
                  </button>
                </div>
              );
            })}
            {!filtered.length && <p className="px-5 py-12 text-center text-sm text-slate-500">Nenhum produto encontrado.</p>}
            {filtered.length > 80 && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Mostrando 80 de {filtered.length}. Refine a busca para localizar os demais modelos.</p>}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Salvar altera as vitrines da loja imediatamente. Não precisa fazer deploy.</p>
          <SubmitButton className={btnPrimary} pendingText="Salvando vitrines…">Salvar vitrines da página inicial</SubmitButton>
        </div>
        <div className="mx-auto mt-2 max-w-5xl"><ActionMessage state={state} /></div>
      </div>
    </form>
  );
}
