import { Card, PageHeader, Stat, inputCls, btnPrimary } from "@/components/admin/ui";
import { PeriodFilter } from "@/components/admin/PeriodFilter";
import { int, pct } from "@/components/admin/format";
import { formatBRL } from "@/utils/format";
import { resolvePeriod } from "@/server/admin/period";
import { funnel, funnelFilterOptions } from "@/server/admin/reports";

export const metadata = { title: "Funil" };
type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function FunnelPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const p = resolvePeriod(sp);
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { productId: str("produto"), source: str("origem"), campaign: str("campanha"), device: str("dispositivo") };
  const [f, opts] = await Promise.all([funnel(p, filters), funnelFilterOptions()]);
  const max = Math.max(1, f.steps[0]?.value ?? 1);

  return (
    <div>
      <PageHeader title="Funil" description="Sessões que chegaram a cada etapa (eventos próprios)" actions={<PeriodFilter current={p.key} from={p.fromInput} to={p.toInput} />} />
      <form className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        {["periodo", "de", "ate"].map((k) => str(k) && <input key={k} type="hidden" name={k} value={str(k)} />)}
        <select name="produto" defaultValue={filters.productId ?? ""} className={inputCls} aria-label="Produto">
          <option value="">Todos os produtos</option>
          {opts.products.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select name="origem" defaultValue={filters.source ?? ""} className={inputCls} aria-label="Origem">
          <option value="">Todas as origens</option>
          {opts.sources.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select name="campanha" defaultValue={filters.campaign ?? ""} className={inputCls} aria-label="Campanha">
          <option value="">Todas as campanhas</option>
          {opts.campaigns.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select name="dispositivo" defaultValue={filters.device ?? ""} className={inputCls} aria-label="Dispositivo">
          <option value="">Todos os dispositivos</option>
          {opts.devices.map((o) => <option key={o}>{o}</option>)}
        </select>
        <button className={btnPrimary}>Aplicar filtros</button>
      </form>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Visitantes (sessões)" value={int(f.steps[0]?.value ?? 0)} />
        <Stat label="Checkout" value={int(f.steps.find((s) => s.key === "checkout")?.value ?? 0)} />
        <Stat label="Compras" value={int(f.steps.at(-1)?.value ?? 0)} />
        <Stat label="Conversão" value={pct(f.conversion, 2)} hint={`Receita ${formatBRL(f.revenue)}`} />
      </div>

      <Card title={`Etapas · ${p.label}`}>
        <ol className="space-y-3">
          {f.steps.map((s, i) => (
            <li key={s.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">{i + 1}. {s.label}</span>
                <span className="tabular-nums text-slate-600">
                  <b className="text-slate-900">{int(s.value)}</b> · {pct(s.pctOfFirst)} do total
                  {i > 0 && <span className={s.dropFromPrev > 0.5 ? " text-red-600" : " text-slate-500"}> · queda {pct(Math.max(0, s.dropFromPrev))}</span>}
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${(s.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-500">Cada etapa conta sessões com pelo menos um dos eventos da etapa no período. Compras e pagamentos são eventos de servidor, confirmados pelo gateway.</p>
      </Card>
    </div>
  );
}
