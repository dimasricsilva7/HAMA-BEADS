"use client";

import { useState } from "react";

type Result = {
  fetched: number; total: number | null; variants: number; images: number;
  created: number; updated: number; skipped: number; nextFrom: number | null; done: boolean;
};
type Group = { id: string; title: string; description: string; badge: string; type: "category" | "campaign" };
type Progress = {
  fetched: number; total: number | null; variants: number; images: number;
  created: number; updated: number; skipped: number; done: boolean; message: string;
};

const GROUPS: Group[] = [
  { id: "111", title: "Feminino", description: "Clogs, sandálias, chinelos e outros modelos da categoria Feminino.", badge: "Categoria oficial", type: "category" },
  { id: "146", title: "Masculino", description: "Modelos, tamanhos e cores da categoria Masculino.", badge: "Categoria oficial", type: "category" },
  { id: "173", title: "Kids", description: "Modelos infantis e juvenis, com suas cores e tamanhos.", badge: "Categoria oficial", type: "category" },
  { id: "215", title: "Jibbitz", description: "Charms, personagens, temas e packs da coleção completa.", badge: "Categoria oficial", type: "category" },
  { id: "225", title: "Crocs At Work", description: "Modelos e itens da coleção profissional.", badge: "Categoria oficial", type: "category" },
  { id: "1792513037", title: "Bolsas e Acessórios", description: "Bolsas, acessórios, chaveiros e itens relacionados.", badge: "Categoria oficial", type: "category" },
  { id: "595", title: "Esquenta Black Friday", description: "Itens que integram a campanha Esquenta BF.", badge: "Campanha", type: "campaign" },
  { id: "596", title: "Ofertas Black Adulto", description: "Produtos marcados na campanha Ofertas Black adulto.", badge: "Campanha", type: "campaign" },
  { id: "599", title: "Ofertas Black", description: "Produtos marcados na campanha geral Ofertas Black.", badge: "Campanha", type: "campaign" },
];

const REQUESTED_PRODUCTS = [
  { label: "Bayaband Clog — WINTER WHITE/MULTI", url: "https://www.crocs.com.br/sandalia-crocs-bayaband-clog-winter-white-multi-205089_8793/p" },
  { label: "Crocband Clog — BLACK", url: "https://www.crocs.com.br/sandalia-crocs-crocband-clog-black-11016_4891/p" },
] as const;

const emptyProgress = (): Progress => ({
  fetched: 0, total: null, variants: 0, images: 0, created: 0, updated: 0, skipped: 0, done: false, message: "Aguardando importação.",
});

export default function CatalogSyncClient() {
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [error, setError] = useState<string | null>(null);
  const [requestedUrls, setRequestedUrls] = useState<string[]>(REQUESTED_PRODUCTS.map((item) => item.url));
  const [requestedBusy, setRequestedBusy] = useState(false);
  const [requestedResults, setRequestedResults] = useState<string[]>([]);

  async function importGroup(id: string) {
    let from = 0;
    const totals = { fetched: 0, total: null as number | null, variants: 0, images: 0, created: 0, updated: 0, skipped: 0 };
    setProgress((old) => ({ ...old, [id]: { ...emptyProgress(), message: "Iniciando sincronização..." } }));

    while (true) {
      const response = await fetch("/api/admin/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: id, from }),
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Falha ao importar a coleção ${id}.`);
      const page = body as Result;
      totals.fetched += page.fetched;
      totals.variants += page.variants ?? 0;
      totals.images += page.images ?? 0;
      totals.created += page.created;
      totals.updated += page.updated;
      totals.skipped += page.skipped;
      totals.total = page.total ?? totals.total;
      setProgress((old) => ({
        ...old,
        [id]: {
          ...totals,
          done: page.done,
          message: page.done
            ? "Sincronização concluída."
            : `Importando próximo lote... (${totals.fetched}${totals.total ? ` de ${totals.total}` : ""})`,
        },
      }));
      if (page.done || page.nextFrom == null) break;
      from = page.nextFrom;
    }
  }

  async function sync(id: string) {
    if (busy) return;
    setBusy(id);
    setError(null);
    try {
      await importGroup(id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha na importação.";
      setError(message);
      setProgress((old) => ({
        ...old,
        [id]: { ...(old[id] ?? emptyProgress()), done: false, message: "Interrompido. Execute novamente para retomar; os itens já importados não serão duplicados." },
      }));
    } finally {
      setBusy(null);
    }
  }

  async function syncAll() {
    if (busy || requestedBusy) return;
    setBusy("all");
    setError(null);
    try {
      for (const group of GROUPS) {
        await importGroup(group.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na importação completa.");
    } finally {
      setBusy(null);
    }
  }

  async function importRequestedProducts() {
    if (busy || requestedBusy) return;
    setRequestedBusy(true);
    setRequestedResults([]);
    setError(null);
    try {
      for (let index = 0; index < requestedUrls.length; index++) {
        const url = requestedUrls[index].trim();
        if (!url) continue;
        const response = await fetch("/api/admin/catalog/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productUrl: url }),
          cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || `Não foi possível importar o produto ${index + 1}.`);
        setRequestedResults((current) => [...current, `${body.productName} importado · coleções ${(body.collectionIds as string[]).join(", ")} · ${body.variants} variantes`]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao importar os produtos.");
    } finally {
      setRequestedBusy(false);
    }
  }

  const totalProducts = Object.values(progress).reduce((sum, row) => sum + row.fetched, 0);
  const totalCreated = Object.values(progress).reduce((sum, row) => sum + row.created, 0);
  const totalUpdated = Object.values(progress).reduce((sum, row) => sum + row.updated, 0);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <p className="font-bold">Catálogo completo por categoria oficial</p>
        <p className="mt-1">A importação agora consulta as categorias reais da VTEX: Feminino, Masculino, Kids, Jibbitz, Crocs At Work e Bolsas e Acessórios. As campanhas Black Friday são sincronizadas separadamente, sem substituir a categoria principal do produto.</p>
        <p className="mt-2 text-xs">Produtos que pertencem a mais de uma categoria mantêm todos os vínculos; a atualização por ID de origem evita duplicação. O catálogo pode demorar enquanto a coleção Jibbitz, que é maior, é percorrida.</p>
        <button type="button" onClick={syncAll} disabled={Boolean(busy)}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#1d2b17] px-5 text-sm font-extrabold text-white disabled:opacity-50">
          {busy === "all" ? "Importando catálogo completo..." : "Importar catálogo completo"}
        </button>
        {Object.keys(progress).length > 0 && (
          <p className="mt-3 text-xs font-semibold">Nesta execução: {totalProducts.toLocaleString("pt-BR")} produtos consultados · {totalCreated.toLocaleString("pt-BR")} novos · {totalUpdated.toLocaleString("pt-BR")} atualizados.</p>
        )}
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <p className="font-bold">Importar produtos específicos da Crocs</p>
        <p className="mt-1">Cole uma URL oficial de produto para importar o modelo, as fotos, o preço e todas as numerações. A importação preserva os vínculos oficiais de coleção (inclusive quando o modelo pertence ao Feminino e ao Masculino).</p>
        <div className="mt-4 space-y-3">
          {requestedUrls.map((url, index) => (
            <label key={index} className="block">
              <span className="mb-1 block text-xs font-bold">{REQUESTED_PRODUCTS[index]?.label ?? `Produto ${index + 1}`}</span>
              <input value={url} onChange={(event) => setRequestedUrls((current) => current.map((item, i) => i === index ? event.target.value : item))}
                type="url" inputMode="url" className="min-h-10 w-full rounded-lg border border-blue-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500" />
            </label>
          ))}
          <button type="button" onClick={importRequestedProducts} disabled={Boolean(busy) || requestedBusy}
            className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-extrabold text-white disabled:opacity-50">
            {requestedBusy ? "Importando produtos..." : "Importar os produtos acima"}
          </button>
          {requestedResults.length > 0 && <ul className="space-y-1 text-xs font-semibold text-emerald-800">{requestedResults.map((item) => <li key={item}>✓ {item}</li>)}</ul>}
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group) => {
          const state = progress[group.id];
          const percent = state?.total ? Math.min(100, Math.round((state.fetched / state.total) * 100)) : state?.done ? 100 : 0;
          return (
            <section key={group.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.badge}</p>
              <h2 className="mt-2 text-lg font-extrabold text-slate-900">{group.title}</h2>
              <p className="mt-2 min-h-12 text-sm text-slate-600">{group.description}</p>
              <button type="button" onClick={() => sync(group.id)} disabled={Boolean(busy)}
                className="mt-4 min-h-11 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {busy === group.id ? "Sincronizando..." : state?.done ? "Sincronizar novamente" : "Importar coleção"}
              </button>
              {state && (
                <div className="mt-4 space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} /></div>
                  <p className="text-xs font-semibold text-slate-700">{state.message}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>Consultados: <b className="text-slate-800">{state.fetched}{state.total ? ` / ${state.total}` : ""}</b></span>
                    <span>Novos: <b className="text-slate-800">{state.created}</b></span>
                    <span>SKUs / variantes: <b className="text-slate-800">{state.variants}</b></span>
                    <span>Imagens: <b className="text-slate-800">{state.images}</b></span>
                    <span>Atualizados: <b className="text-slate-800">{state.updated}</b></span>
                    <span>Ignorados: <b className="text-slate-800">{state.skipped}</b></span>
                  </div>
                </div>
              )}
              <p className="mt-4 text-[11px] text-slate-400">ID VTEX: {group.id} · {group.type === "category" ? "Categoria" : "Campanha"}</p>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">A sincronização é iniciada pelo administrador. Ela não remove produtos ausentes na origem nem altera pedidos antigos. Revise preço, estoque e autorização de uso dos materiais antes de ativar um produto.</p>
    </div>
  );
}
