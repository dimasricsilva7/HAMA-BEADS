"use client";

import { useMemo, useState } from "react";
import { Badge, Field, inputCls } from "@/components/admin/ui";
import { saveSectionDiscount } from "./actions";

type ProductPreview = { id: string; name: string; priceCents: number; individualDiscountPercent: number | null };
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const localDateValue = (d: Date | null) => d ? new Date(d.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export function SectionDiscountForm({ category, currentPercent, startsAt, endsAt, products, inheritCount, individualCount }: {
  category: string;
  currentPercent: number;
  startsAt: Date | null;
  endsAt: Date | null;
  products: ProductPreview[];
  inheritCount: number;
  individualCount: number;
}) {
  const [percent, setPercent] = useState(String(currentPercent));
  const pct = Math.min(100, Math.max(0, Number.parseInt(percent || "0", 10) || 0));
  const preview = useMemo(() => products.slice(0, 4).map((p) => {
    const effectivePct = p.individualDiscountPercent ?? pct;
    return { ...p, discount: effectivePct, newPrice: Math.round(p.priceCents * (100 - effectivePct) / 100), inherited: p.individualDiscountPercent == null };
  }), [products, pct]);

  return (
    <div className="space-y-3">
      <form action={saveSectionDiscount} className="space-y-3">
        <input type="hidden" name="category" value={category} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Desconto da seção (%)">
            <input className={inputCls} type="number" name="percent" min="0" max="100" step="1" value={percent} onChange={(e) => setPercent(e.target.value)} required />
          </Field>
          <Field label="Início (opcional)">
            <input className={inputCls} type="datetime-local" name="startsAt" defaultValue={localDateValue(startsAt)} />
          </Field>
          <Field label="Fim (opcional)">
            <input className={inputCls} type="datetime-local" name="endsAt" defaultValue={localDateValue(endsAt)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {currentPercent > 0 ? <Badge tone="green">{currentPercent}% configurado</Badge> : <Badge>Sem desconto configurado</Badge>}
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Salvar campanha</button>
        </div>
      </form>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Prévia antes de salvar</p>
          <p className="text-xs text-slate-500">{inheritCount} produto(s) herdarão {pct}% · {individualCount} com regra individual</p>
        </div>
        {preview.length === 0 ? <p className="mt-2 text-xs text-slate-500">Nenhum produto ativo nesta seção.</p> : (
          <ul className="mt-2 divide-y divide-slate-200">
            {preview.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                <span className="min-w-0 truncate font-medium text-slate-700">{p.name}{!p.inherited && <span className="ml-1 text-slate-400">(individual)</span>}</span>
                <span className="shrink-0 text-right">
                  <span className="block text-slate-400 line-through">{brl(p.priceCents)}</span>
                  <span className="font-bold text-slate-900">{brl(p.newPrice)} · {p.discount}%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-slate-500">Amostra de até 4 produtos. O total de produtos afetados aparece acima. Exceções individuais permanecem; campanhas de preço fixo podem resultar em um preço ainda menor.</p>
      </div>
    </div>
  );
}
