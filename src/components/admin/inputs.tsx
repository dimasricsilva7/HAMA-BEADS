"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { inputCls, textareaCls, btnSecondary } from "./ui";
import { COMPONENT_TYPES, PIXEL_ICONS } from "@/lib/domain";

/** Campo de mídia: cole uma URL ou envie um arquivo (Vercel Blob; fallback local em dev). */
export function MediaInput({ name, defaultValue, accept = "image/*", label, folder = "media" }: { name: string; defaultValue?: string | null; accept?: string; label?: string; folder?: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const embed = /youtu\.?be/i.test(url) ? "YouTube" : /vimeo\.com/i.test(url) ? "Vimeo" : null;
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url) || accept.startsWith("video");

  async function onFile(file: File) {
    setStatus("Enviando…");
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
      try {
        const blob = await upload(`${folder}/${safe}`, file, { access: "public", handleUploadUrl: "/api/admin/blob" });
        setUrl(blob.url);
      } catch (blobErr) {
        // Em produção não existe fallback (o servidor recusa arquivos grandes): mostra o erro real
        if (process.env.NODE_ENV === "production") {
          const msg = blobErr instanceof Error ? blobErr.message : "";
          throw new Error(
            /blocked|suspend|forbidden|403/i.test(msg)
              ? "Armazenamento de arquivos da Vercel bloqueado (limite do plano). Cole um link do YouTube/Vimeo ou de um MP4 hospedado em outro lugar."
              : `Falha no upload${msg ? `: ${msg}` : ""}. Você pode colar um link do YouTube/Vimeo no lugar.`
          );
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha no upload");
        setUrl(json.url);
      }
      setStatus("Enviado ✓ — lembre de salvar");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Falha no upload");
    }
  }

  return (
    <div>
      {label && <p className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>}
      <div className="flex gap-2">
        <input name={name} value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder={accept.startsWith("video") ? "Cole o link (MP4, YouTube ou Vimeo) ou envie" : "Cole o link da imagem (https://…) ou envie"} className={inputCls} />
        <label className={`${btnSecondary} cursor-pointer whitespace-nowrap`}>
          Enviar arquivo
          <input type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        {url && (
          <button type="button" onClick={() => setUrl("")} className={`${btnSecondary} px-3`} aria-label="Limpar">
            ✕
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {status ?? (accept.startsWith("video") ? "Aceita link direto de vídeo (.mp4), YouTube, Vimeo ou upload." : "Aceita link público de imagem (https://…) ou upload.")}
      </p>
      {url && url.startsWith("http:") && <p className="mt-1 text-xs font-semibold text-red-600">Use um link https:// — links http:// não são salvos.</p>}
      {url && embed && <p className="mt-2 text-xs font-semibold text-emerald-700">✓ Link de {embed} reconhecido — o vídeo será incorporado.</p>}
      {url && !isVideo && !embed && /^(https:|\/)/.test(url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mt-2 h-20 w-20 rounded-lg border border-slate-200 object-cover" onError={(e) => ((e.currentTarget.style.display = "none"), setStatus("Não foi possível carregar a imagem desse link. Confira se o link é público e aponta para a imagem."))} />
      )}
      {url && isVideo && !embed && /^(https:|\/)/.test(url) && <video src={url} className="mt-2 h-32 rounded-lg border border-slate-200" controls preload="metadata" />}
    </div>
  );
}

export type ListField = { key: string; label: string; type?: "text" | "textarea" | "select" | "checkbox" | "media" | "number"; options?: readonly string[]; width?: string; placeholder?: string };

/**
 * Editor de listas JSON (composição do kit, especificações, passos, benefícios…).
 * Serializa em um <input hidden name=...> para a Server Action.
 */
export function ListEditor<T extends Record<string, unknown>>({ name, fields, defaultValue, addLabel = "Adicionar item", newItem, idKey }: { name: string; fields: ListField[]; defaultValue: T[]; addLabel?: string; newItem: () => T; idKey?: string }) {
  const [items, setItems] = useState<T[]>(defaultValue);
  const update = (i: number, key: string, value: unknown) => setItems((list) => list.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.map((it, i) => (
        <div key={idKey ? String(it[idKey]) : i} className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          {fields.map((f) => (
            <div key={f.key} className={f.width ?? "min-w-[140px] flex-1"}>
              <p className="mb-0.5 text-[10px] font-semibold uppercase text-slate-400">{f.label}</p>
              {f.type === "textarea" ? (
                <textarea value={String(it[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value)} rows={2} className={textareaCls} />
              ) : f.type === "select" ? (
                <select value={String(it[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls}>
                  {f.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "checkbox" ? (
                <input type="checkbox" checked={Boolean(it[f.key])} onChange={(e) => update(i, f.key, e.target.checked)} className="mt-2 h-5 w-5" />
              ) : f.type === "number" ? (
                <input type="number" value={String(it[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value === "" ? null : Number(e.target.value))} className={inputCls} />
              ) : (
                <input value={String(it[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value)} placeholder={f.placeholder} className={inputCls} />
              )}
            </div>
          ))}
          <div className="flex gap-1 self-end">
            <button type="button" onClick={() => move(i, -1)} className="h-10 w-8 rounded border border-slate-300 bg-white text-sm" aria-label="Subir">↑</button>
            <button type="button" onClick={() => move(i, 1)} className="h-10 w-8 rounded border border-slate-300 bg-white text-sm" aria-label="Descer">↓</button>
            <button type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} className="h-10 rounded border border-red-200 bg-white px-2 text-xs font-semibold text-red-600">Remover</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setItems((l) => [...l, newItem()])} className={btnSecondary}>
        + {addLabel}
      </button>
    </div>
  );
}

/** Lista simples de textos (ex.: itens de público, categorias). */
export function StringListEditor({ name, defaultValue, addLabel = "Adicionar" }: { name: string; defaultValue: string[]; addLabel?: string }) {
  return (
    <ListEditor
      name={`${name}__obj`}
      fields={[{ key: "v", label: "Texto" }]}
      defaultValue={defaultValue.map((v) => ({ v }))}
      newItem={() => ({ v: "" })}
      addLabel={addLabel}
    />
  );
}

/** Seleção múltipla de produtos → JSON de IDs. */
export function ProductMultiSelect({ name, products, defaultValue }: { name: string; products: { id: string; name: string; active: boolean }[]; defaultValue: string[] }) {
  const [sel, setSel] = useState<string[]>(defaultValue);
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(sel)} />
      <div className="flex flex-wrap gap-2">
        {products.map((p) => {
          const on = sel.includes(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => setSel((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"} ${p.active ? "" : "opacity-60"}`}
              aria-pressed={on}
            >
              {p.name}
              {!p.active && " (inativo)"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────── Editores prontos (a função newItem fica no cliente) ─────────────


let seq = 0;
const uid = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

export function ComponentsEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return (
    <ListEditor
      name={name}
      idKey="id"
      defaultValue={defaultValue}
      addLabel="Adicionar componente"
      newItem={() => ({ id: uid(), type: "accessory", label: "", quantity: "", detail: "", imageUrl: "", isBonus: false })}
      fields={[
        { key: "type", label: "Tipo", type: "select", options: COMPONENT_TYPES, width: "w-32" },
        { key: "label", label: "Nome exibido" },
        { key: "quantity", label: "Qtd.", width: "w-20" },
        { key: "detail", label: "Detalhe (ex.: dimensão)" },
        { key: "imageUrl", label: "Imagem (URL)" },
        { key: "isBonus", label: "Bônus", type: "checkbox", width: "w-14" },
      ]}
    />
  );
}

export function SpecsEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return <ListEditor name={name} defaultValue={defaultValue} addLabel="Adicionar especificação" newItem={() => ({ label: "", value: "" })} fields={[{ key: "label", label: "Nome", placeholder: "Tamanho das peças" }, { key: "value", label: "Valor" }]} />;
}

export function GalleryEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return <ListEditor name={name} defaultValue={defaultValue} addLabel="Adicionar imagem" newItem={() => ({ url: "", alt: "" })} fields={[{ key: "url", label: "URL da imagem" }, { key: "alt", label: "Texto alternativo" }]} />;
}

export function IconItemsEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return (
    <ListEditor
      name={name}
      defaultValue={defaultValue}
      addLabel="Adicionar item"
      newItem={() => ({ icon: "star", title: "", text: "" })}
      fields={[{ key: "icon", label: "Ícone", type: "select", options: PIXEL_ICONS, width: "w-32" }, { key: "title", label: "Título" }, { key: "text", label: "Texto", type: "textarea" }]}
    />
  );
}

export function StepsEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return <ListEditor name={name} defaultValue={defaultValue} addLabel="Adicionar passo" newItem={() => ({ title: "", text: "" })} fields={[{ key: "title", label: "Título" }, { key: "text", label: "Texto", type: "textarea" }]} />;
}

export function StatsEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return <ListEditor name={name} defaultValue={defaultValue} addLabel="Adicionar indicador" newItem={() => ({ value: "", label: "" })} fields={[{ key: "value", label: "Número/destaque", width: "w-40" }, { key: "label", label: "Legenda" }]} />;
}

export function VariantsEditor({ name, defaultValue }: { name: string; defaultValue: Record<string, unknown>[] }) {
  return (
    <ListEditor
      name={name}
      defaultValue={defaultValue}
      addLabel="Adicionar variante"
      newItem={() => ({ key: String.fromCharCode(97 + Math.floor(Math.random() * 20)), label: "", weight: 50, value: "" })}
      fields={[{ key: "key", label: "Chave", width: "w-20" }, { key: "label", label: "Nome" }, { key: "weight", label: "Peso", type: "number", width: "w-20" }, { key: "value", label: "Valor (texto, URL, centavos, ID…)", type: "textarea" }]}
    />
  );
}
