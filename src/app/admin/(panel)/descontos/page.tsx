import { Badge, Card, Field, PageHeader, inputCls } from "@/components/admin/ui";
import { CATEGORY_LABEL } from "@/lib/domain";
import { db } from "@/lib/db";
import { saveSectionDiscount, removeSectionDiscount } from "./actions";

export const metadata = { title: "Descontos" };

const money = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function DiscountsPage() {
  const [counts, rules, products] = await Promise.all([
    db.product.groupBy({ by: ["category"], where: { active: true }, _count: { _all: true } }),
    db.sectionDiscount.findMany(),
    db.product.findMany({ where: { active: true, individualDiscountPercent: { not: null } }, select: { id: true, name: true, category: true, priceCents: true, individualDiscountPercent: true }, orderBy: { name: "asc" } }),
  ]);
  const countByCategory = new Map(counts.map((x) => [x.category, x._count._all]));
  const ruleByCategory = new Map(rules.map((x) => [x.category, x]));
  const categories = Object.entries(CATEGORY_LABEL);
  const activeRules = rules.filter((r) => r.active && r.percent > 0);
  return (
    <div>
      <PageHeader title="Descontos" description="Configure percentuais por seção ou por produto. O preço original permanece preservado e o checkout recalcula o preço no servidor." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs font-semibold uppercase text-slate-500">Seções com campanha</p><p className="mt-1 text-2xl font-extrabold">{activeRules.length}</p></Card>
        <Card><p className="text-xs font-semibold uppercase text-slate-500">Produtos com exceção individual</p><p className="mt-1 text-2xl font-extrabold">{products.length}</p></Card>
        <Card><p className="text-xs font-semibold uppercase text-slate-500">Produtos ativos</p><p className="mt-1 text-2xl font-extrabold">{counts.reduce((s, x) => s + x._count._all, 0)}</p></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {categories.map(([key, label]) => {
          const rule = ruleByCategory.get(key as keyof typeof CATEGORY_LABEL);
          const count = countByCategory.get(key as keyof typeof CATEGORY_LABEL) ?? 0;
          const overrides = products.filter((p) => p.category === key);
          return (
            <Card key={key} title={label} description={`${count} produto(s) ativo(s) nesta seção · ${overrides.length} com desconto individual`}>
              <form action={saveSectionDiscount} className="space-y-3">
                <input type="hidden" name="category" value={key} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Desconto da seção (%)">
                    <input className={inputCls} type="number" name="percent" min="0" max="100" step="1" defaultValue={rule?.active ? rule.percent : 0} required />
                  </Field>
                  <Field label="Início (opcional)">
                    <input className={inputCls} type="datetime-local" name="startsAt" defaultValue={rule?.startsAt ? new Date(rule.startsAt.getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : ""} />
                  </Field>
                  <Field label="Fim (opcional)">
                    <input className={inputCls} type="datetime-local" name="endsAt" defaultValue={rule?.endsAt ? new Date(rule.endsAt.getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : ""} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {rule?.active && rule.percent > 0 ? <Badge tone="green">{rule.percent}% ativo</Badge> : <Badge>Sem desconto de seção</Badge>}
                  <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Salvar campanha</button>
                </div>
              </form>
            </Card>
          );
        })}
      </div>
      <Card title="Exceções individuais" description="O desconto individual tem prioridade sobre o percentual da seção. Edite o produto para alterar ou remover essa exceção." className="mt-6">
        {products.length === 0 ? <p className="text-sm text-slate-500">Nenhum produto com desconto individual.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Produto</th><th>Seção</th><th>Desconto</th><th>Preço base</th><th></th></tr></thead>
              <tbody>{products.map((p) => <tr key={p.id} className="border-b last:border-0"><td className="py-3 font-semibold">{p.name}</td><td>{CATEGORY_LABEL[p.category]}</td><td><Badge tone="green">{p.individualDiscountPercent}%</Badge></td><td>{money(p.priceCents)}</td><td><a className="font-semibold underline" href={`/admin/produtos/${p.id}`}>Editar</a></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-4 text-xs text-slate-500">Regra: produto com desconto individual usa esse percentual; os demais herdam o desconto da seção. Os percentuais não são somados. Campanhas programadas só entram no preço durante a janela configurada.</p>
    </div>
  );
}
