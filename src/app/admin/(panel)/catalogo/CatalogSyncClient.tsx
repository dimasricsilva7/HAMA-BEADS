"use client";

import { useState } from "react";

type Result = { fetched: number; total: number | null; variants: number; images: number; created: number; updated: number; skipped: number; nextFrom: number | null; done: boolean };
type Group = { id: string; title: string; description: string; badge: string };

const GROUPS: Group[] = [
  { id: "596", title: "Adulto", description: "Coleção Adulto · catálogo VTEX consultado: 211 produtos.", badge: "Calçados adulto" },
  { id: "597", title: "Infantil", description: "Esquenta BF Kids · catálogo VTEX consultado: 123 produtos.", badge: "Infantil e juvenil" },
  { id: "469", title: "Jibbitz", description: "Coleção Jibbitz · catálogo VTEX consultado: 1.755 produtos.", badge: "Pins e acessórios" },
];

export default function CatalogSyncClient() {
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, { fetched: number; total: number | null; variants: number; images: number; created: number; updated: number; skipped: number; done: boolean; message: string }>>({});
  const [error, setError] = useState<string | null>(null);

  async function sync(id: string) {
    if (busy) return;
    setBusy(id);
    setError(null);
    let from = 0;
    let fetched = 0, variants = 0, images = 0, created = 0, updated = 0, skipped = 0;
    let total: number | null = null;
    setProgress((old) => ({ ...old, [id]: { fetched: 0, total: null, variants: 0, images: 0, created: 0, updated: 0, skipped: 0, done: false, message: "Iniciando sincronização…" } }));
    try {
      while (true) {
        const response = await fetch("/api/admin/catalog/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionId: id, from }),
          cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Não foi possível importar esta página do catálogo.");
        const page = body as Result;
        fetched += page.fetched;
        variants += page.variants ?? 0;
        images += page.images ?? 0;
        created += page.created;
        updated += page.updated;
        skipped += page.skipped;
        total = page.total ?? total;
        setProgress((old) => ({
          ...old,
          [id]: {
            fetched, total, variants, images, created, updated, skipped, done: page.done,
            message: page.done ? "Sincronização concluída." : `Importando próximo lote… (${fetched}${total ? ` de ${total}` : ""})`,
          },
        }));
        if (page.done || page.nextFrom == null) break;
        from = page.nextFrom;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha na importação.";
      setError(message);
      setProgress((old) => ({ ...old, [id]: { fetched, total, variants, images, created, updated, skipped, done: false, message: "Interrompido. Você pode executar novamente; os produtos já importados serão atualizados sem duplicar." } }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-bold">Importação manual do catálogo</p>
        <p className="mt-1">Os totais são consultados na API VTEX e podem variar. A consulta feita em 1/11/2026 retornou 211 itens Adulto, 123 Infantil e 1.755 Jibbitz. A importação percorre a coleção paginada e atualiza os itens pelo ID de origem. As URLs originais das imagens são armazenadas no catálogo; não copiamos arquivos para o storage.</p>
        <p className="mt-2 text-xs">Use imagens, descrições, logotipos e dados comerciais de terceiros apenas com autorização/licença. Esta interface deve identificar claramente sua operação como loja independente, não como canal oficial da Crocs.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const state = progress[group.id];
          const percent = state?.total ? Math.min(100, Math.round(state.fetched / state.total * 100)) : state?.done ? 100 : 0;
          return (
            <section key={group.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.badge}</p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-900">{group.title}</h2>
              <p className="mt-2 min-h-10 text-sm text-slate-600">{group.description}</p>
              <button
                type="button"
                onClick={() => sync(group.id)}
                disabled={Boolean(busy)}
                className="mt-5 min-h-11 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy === group.id ? "Sincronizando…" : state?.done ? "Sincronizar novamente" : "Importar coleção"}
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
              <p className="mt-4 text-[11px] text-slate-400">ID da coleção: {group.id}</p>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">A sincronização é iniciada pelo administrador. Ela não remove produtos que deixaram de aparecer na origem e não altera pedidos antigos. Revise preço, estoque e permissão de uso das imagens antes de ativar o catálogo no site.</p>
    </div>
  );
}
