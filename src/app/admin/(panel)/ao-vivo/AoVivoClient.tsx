"use client";

import { useEffect, useState } from "react";

type Row = { label: string; n: number };
type Visitor = {
  id: string;
  visitor: string;
  page: string;
  path: string;
  landingPage: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  device: string;
  browser: string | null;
  os: string | null;
  pageViews: number;
  firstSeenAt: string;
  lastSeenAt: string;
};
type Data = { online: number; pages: Row[]; sources: Row[]; devices: Row[]; visitors: Visitor[]; at: string };

function Summary({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {rows.length === 0 ? <p className="mt-2 text-sm text-slate-400">Ainda sem dados</p> : (
        <ul className="mt-2 space-y-2">
          {rows.map((r) => <li key={r.label} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-700">{r.label}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums">{r.n}</span></li>)}
        </ul>
      )}
    </section>
  );
}

const clock = (v: string) => new Date(v).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const elapsed = (v: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s atrás` : `${Math.floor(seconds / 60)}min atrás`;
};

export function AoVivoClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/online", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as Data;
        if (active) { setData(json); setError(false); }
      } catch { if (active) setError(true); }
    };
    load();
    const refresh = setInterval(load, 5000);
    return () => { active = false; clearInterval(refresh); };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"/></span>
        <div><p className="text-3xl font-extrabold tabular-nums text-slate-900">{data?.online ?? "—"}</p><p className="text-sm text-slate-500">visitantes online</p></div>
        <div className="ml-auto text-right text-xs text-slate-400">{error ? "Falha ao atualizar — tentando novamente" : data ? `Atualizado às ${clock(data.at)} · atualização a cada 5s` : "Conectando…"}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Páginas acessadas" rows={data?.pages ?? []}/>
        <Summary title="Origem do tráfego" rows={data?.sources ?? []}/>
        <Summary title="Dispositivos" rows={data?.devices ?? []}/>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <div><h2 className="font-bold text-slate-900">Visitantes ativos</h2><p className="text-xs text-slate-500">Sessões vistas nos últimos 15 segundos. Identificadores anônimos.</p></div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{data?.visitors.length ?? 0} ativos</span>
        </div>
        {!data?.visitors.length ? <p className="p-8 text-center text-sm text-slate-500">Nenhum visitante ativo no momento.</p> : (
          <div className="divide-y divide-slate-100">
            {data.visitors.map((v) => (
              <article key={v.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr] lg:items-center">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"/>{v.page}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{v.path}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Visitante {v.visitor} · {v.pageViews} páginas</p>
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-slate-700">Origem: {v.source}</p>
                  {v.medium && <p className="mt-1 text-slate-500">Mídia: {v.medium}</p>}
                  {v.campaign && <p className="mt-1 truncate text-slate-500">Campanha: {v.campaign}</p>}
                  {v.referrer && <p className="mt-1 truncate text-slate-400" title={v.referrer}>Referência: {v.referrer}</p>}
                </div>
                <div className="text-xs text-slate-600">
                  <p>{v.device}</p><p className="mt-1 text-slate-400">{[v.browser,v.os].filter(Boolean).join(" · ") || "Navegador não identificado"}</p>
                  <p className="mt-1 text-slate-400">Entrou às {clock(v.firstSeenAt)}</p>
                </div>
                <div className="text-xs lg:text-right">
                  <p className="font-semibold text-slate-700">Última atividade</p><p className="mt-1 text-slate-500">{elapsed(v.lastSeenAt)}</p><p className="mt-1 text-slate-400">às {clock(v.lastSeenAt)}</p>
                  <p className="mt-1 text-[10px] text-slate-400">ID sessão {v.id}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="text-xs text-slate-500">A origem usa UTMs quando disponíveis; caso contrário, apresenta o canal/referrer classificado. O painel não exibe IP, CPF, telefone ou nome do visitante anônimo.</p>
    </div>
  );
}
