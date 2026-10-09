"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PixelArt, PixelIcon } from "@/components/ui/PixelArt";
import { Price } from "@/components/ui/Price";
import { gaEvent, metaEvent, track } from "@/lib/client/tracking";
import { ORDER_STATUS_LABEL, isAwaitingStatus, isCrediarioPending, isPaidStatus } from "@/lib/domain";
import { formatBRL } from "@/utils/format";
import type { PublicOrder, PublicUpsell } from "@/types/order";

function useCountdown(iso: string | null) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    const end = new Date(iso).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [iso]);
  return left;
}

function Items({ order }: { order: PublicOrder }) {
  return (
    <div className="space-y-2 text-sm">
      {order.items.map((i, idx) => (
        <div key={idx} className="flex justify-between gap-3">
          <span className="text-muted">{i.quantity}× {i.name}</span>
          <span className="shrink-0 tabular-nums">{formatBRL(i.totalPriceCents)}</span>
        </div>
      ))}
      {order.discountCents > 0 && (
        <div className="flex justify-between text-success"><span>Desconto{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>− {formatBRL(order.discountCents)}</span></div>
      )}
      {order.shippingCents > 0 && (
        <div className="flex justify-between"><span className="text-muted">Frete</span><span>{formatBRL(order.shippingCents)}</span></div>
      )}
      <div className="flex justify-between border-t border-line pt-2 font-bold"><span>Total</span><span className="tabular-nums">{formatBRL(order.totalCents)}</span></div>
      {order.crediario && (
        <div className="flex justify-between pt-1 text-muted"><span>{order.crediario.methodLabel}</span><span className="font-semibold text-ink">{order.crediario.installmentLabel}</span></div>
      )}
    </div>
  );
}

function UpsellOffer({ order, token, upsell }: { order: PublicOrder; token: string; upsell: PublicUpsell }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/upsell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: order.orderNumber, t: token, upsellId: upsell.id, action: "view" }) }).catch(() => {});
  }, [order.orderNumber, token, upsell.id]);

  const act = async (action: "accept" | "reject") => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/upsell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: order.orderNumber, t: token, upsellId: upsell.id, action }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível continuar.");
      if (action === "accept") router.push(`/pedido/${json.orderNumber}?t=${json.token}`);
      else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível continuar.");
      setBusy(null);
    }
  };

  return (
    <section className="animate-rise overflow-hidden rounded-card border-[3px] border-primary bg-surface shadow-lift" aria-labelledby="upsell-title">
      <div className="bg-primary px-5 py-3 text-white">
        <p className="eyebrow">Oferta para o seu pedido</p>
        <p className="font-display text-lg font-extrabold">{upsell.headline}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#EFE8FF]">
          {upsell.imageUrl ? <Image src={upsell.imageUrl} alt={upsell.productName} fill sizes="140px" className="object-cover" /> : <PixelArt sprite="rocket" className="absolute left-[15%] top-[15%] h-[70%] w-[70%]" />}
        </div>
        <div>
          <h2 id="upsell-title" className="font-display text-2xl font-extrabold">{upsell.title}</h2>
          {upsell.description && <p className="mt-1 text-muted">{upsell.description}</p>}
          <Price priceCents={upsell.priceCents} listPriceCents={upsell.listPriceCents} className="mt-3" />
          <p className="text-xs text-muted">Pagamento separado via PIX. Seu pedido atual não é alterado.</p>
        </div>
      </div>
      {error && <p className="mx-5 mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
      <div className="flex flex-col gap-2 px-5 pb-5 sm:flex-row-reverse">
        <button onClick={() => act("accept")} disabled={!!busy} data-cta="upsell_accept" className="btn-primary flex-1">
          {busy === "accept" ? "Gerando PIX…" : "Sim, quero adicionar"}
        </button>
        <button onClick={() => act("reject")} disabled={!!busy} data-cta="upsell_reject" className="btn-ghost flex-1 text-muted">
          {busy === "reject" ? "…" : "Não, obrigado"}
        </button>
      </div>
    </section>
  );
}

export type CrediarioTexts = { successTitle: string; successMessage: string; infoMessage: string };

export function OrderClient({ initial, token, qrSvg, upsell, whatsappUrl, storeName, crediarioTexts }: { initial: PublicOrder; token: string; qrSvg: string | null; upsell: PublicUpsell | null; whatsappUrl: string | null; storeName: string; crediarioTexts: CrediarioTexts }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const left = useCountdown(isAwaitingStatus(order.status) ? order.pixExpiresAt : null);
  const awaiting = isAwaitingStatus(order.status);
  const paid = isPaidStatus(order.status);

  useEffect(() => setOrder(initial), [initial]);

  // Polling enquanto aguarda pagamento (o status vem SEMPRE do servidor/gateway)
  useEffect(() => {
    if (!awaiting) return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/status?pedido=${encodeURIComponent(order.orderNumber)}&t=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (res.ok && !stop) {
          const next = (await res.json()) as PublicOrder;
          if (next.status !== order.status || next.pixCopyPaste !== order.pixCopyPaste) router.refresh();
          setOrder(next);
        }
      } catch {
        /* rede instável: tenta de novo */
      }
    };
    const t = setInterval(() => document.visibilityState === "visible" && poll(), 5000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [awaiting, order.orderNumber, order.status, order.pixCopyPaste, token, router]);

  // Purchase no navegador somente quando o servidor confirma o pagamento (mesmo event_id da CAPI)
  useEffect(() => {
    if (!paid || !order.metaEventId) return;
    const key = `hb_purchase_${order.orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    metaEvent("Purchase", { value: order.totalCents / 100, currency: "BRL", content_type: "product", num_items: order.items.reduce((s, i) => s + i.quantity, 0) }, { eventId: order.metaEventId });
    gaEvent("purchase", { transaction_id: order.orderNumber, value: order.totalCents / 100, currency: "BRL", items: order.items.map((i) => ({ item_name: i.name, price: i.unitPriceCents / 100, quantity: i.quantity })) });
  }, [paid, order.metaEventId, order.orderNumber, order.totalCents, order.items]);

  const copy = async () => {
    if (!order.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(order.pixCopyPaste);
    } catch {
      const ta = document.getElementById("pix-code") as HTMLTextAreaElement | null;
      ta?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    track("pix_copy", { valueCents: order.totalCents, props: { order: order.orderNumber } });
    setTimeout(() => setCopied(false), 2500);
  };

  const checkNow = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/status?pedido=${encodeURIComponent(order.orderNumber)}&t=${encodeURIComponent(token)}&force=1`, { cache: "no-store" });
      if (res.ok) {
        const next = (await res.json()) as PublicOrder;
        setOrder(next);
        if (next.status !== order.status) router.refresh();
      }
    } finally {
      setTimeout(() => setChecking(false), 1200);
    }
  };

  const retryPix = async () => {
    setRetrying(true);
    try {
      await fetch(`/api/orders/status?pedido=${encodeURIComponent(order.orderNumber)}&t=${encodeURIComponent(token)}&retry=1`, { cache: "no-store" });
      router.refresh();
    } finally {
      setTimeout(() => setRetrying(false), 1500);
    }
  };

  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const renewPix = async () => {
    setRenewing(true);
    setRenewError(null);
    try {
      const res = await fetch("/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: order.orderNumber, t: token }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível gerar um novo PIX.");
      setOrder(json as PublicOrder);
      track("pix_renewed", { valueCents: order.totalCents, props: { order: order.orderNumber } });
      router.refresh();
    } catch (e) {
      setRenewError(e instanceof Error ? e.message : "Não foi possível gerar um novo PIX.");
    } finally {
      setRenewing(false);
    }
  };
  const credPending = isCrediarioPending(order.status);
  const credRejected = order.status === "CREDIARIO_RECUSADO";
  const canRenew = order.status === "EXPIRED" || order.status === "FAILED";
  const expiredNow = awaiting && left === 0;

  const mm = left != null ? Math.floor(left / 60000) : null;
  const ss = left != null ? Math.floor((left % 60000) / 1000) : null;

  return (
    <div className="container-page max-w-2xl space-y-5 py-6 sm:py-10">
      <div className="text-center">
        <p className="text-sm font-semibold text-muted">Pedido {order.orderNumber}</p>
        {awaiting && <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Falta pouco, {order.customerFirstName}!</h1>}
        {paid && <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Pagamento confirmado! 🎉</h1>}
        {credPending && <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{crediarioTexts.successTitle}</h1>}
        {canRenew && <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Seu kit ainda está te esperando, {order.customerFirstName}!</h1>}
        {!awaiting && !paid && !canRenew && !credPending && <h1 className="mt-1 font-display text-3xl font-extrabold">{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}</h1>}
      </div>

      {/* Crediário: pedido registrado, aguardando análise do protocolo */}
      {credPending && (
        <section className="card p-5 text-center" aria-labelledby="cred-title">
          <PixelArt sprite="heart" className="mx-auto w-14" />
          <p id="cred-title" className="mt-3 font-extrabold">{order.crediario?.methodLabel ?? "Crediário"}{order.crediario?.installmentLabel ? ` · ${order.crediario.installmentLabel}` : ""}</p>
          {crediarioTexts.successMessage && <p className="mt-2 text-muted">{crediarioTexts.successMessage}</p>}
          {crediarioTexts.infoMessage && <p className="mt-3 rounded-xl bg-surface px-4 py-3 text-sm">{crediarioTexts.infoMessage}</p>}
          <p className="mt-3 text-sm font-semibold text-primary">{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL]}</p>
        </section>
      )}

      {credRejected && (
        <section className="card p-5 text-center">
          <p className="font-extrabold">{ORDER_STATUS_LABEL.CREDIARIO_RECUSADO}</p>
          <p className="mt-2 text-muted">Não foi possível aprovar este pedido no crediário. Fale com a gente para concluir a compra de outra forma.</p>
          {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-light mt-4 inline-block">Falar no WhatsApp</a>}
        </section>
      )}

      {/* PIX vencido → novo código no mesmo pedido */}
      {(canRenew || expiredNow) && (
        <section className="card overflow-hidden text-center" aria-labelledby="renew-title">
          <div className="bg-secondary/25 px-5 py-4">
            <p id="renew-title" className="font-extrabold">O código PIX anterior expirou</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{formatBRL(order.totalCents)}</p>
            <p className="mt-1 text-sm text-muted">Gere um novo código em 1 clique — mesmo pedido, mesmos itens e mesmo valor.</p>
          </div>
          <div className="p-5">
            <button onClick={renewPix} disabled={renewing} data-cta="pix_renew" className="btn-primary w-full">
              {renewing ? "Gerando novo PIX…" : "GERAR NOVO PIX"}
            </button>
            {renewError && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{renewError}</p>}
            <p className="mt-3 text-xs text-muted">Se você já pagou o código anterior, não pague de novo: fale com a gente pelo WhatsApp.</p>
          </div>
        </section>
      )}

      {/* PIX */}
      {awaiting && order.pixCopyPaste && !expiredNow && (
        <section className="card overflow-hidden" aria-labelledby="pix-title">
          <div className="bg-success/10 px-5 py-3 text-center">
            <p id="pix-title" className="font-extrabold">Pague com PIX para concluir</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{formatBRL(order.totalCents)}</p>
            {left != null && (
              <p className={`mt-1 text-sm font-semibold ${left < 5 * 60000 ? "text-danger" : "text-muted"}`} aria-live="polite">
                {left > 0 ? `O código expira em ${mm}:${String(ss).padStart(2, "0")}` : "O prazo deste PIX terminou. Se já pagou, aguarde a confirmação."}
              </p>
            )}
          </div>
          <div className="p-5">
            <ol className="mb-4 space-y-1 text-sm text-muted">
              <li>1. Copie o código abaixo (ou escaneie o QR Code)</li>
              <li>2. Abra o app do seu banco e escolha <b>PIX copia e cola</b></li>
              <li>3. Confirme o pagamento — a confirmação aqui é automática</li>
            </ol>
            <button onClick={copy} data-cta="pix_copy" className={`btn w-full ${copied ? "bg-success text-white" : "btn-primary"}`}>
              {copied ? "Código copiado ✓" : "COPIAR PIX"}
            </button>
            <label htmlFor="pix-code" className="sr-only">Código PIX copia e cola</label>
            <textarea id="pix-code" readOnly value={order.pixCopyPaste} rows={3} className="mt-3 w-full resize-none rounded-2xl border-2 border-line bg-bg p-3 font-mono text-xs text-muted" onFocus={(e) => e.currentTarget.select()} />
            {qrSvg && (
              <details className="mt-3 text-center" open>
                <summary className="cursor-pointer text-sm font-bold text-primary">Mostrar QR Code</summary>
                <div className="mx-auto mt-3 w-56 rounded-2xl border border-line bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label="QR Code do PIX" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              </details>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted" aria-live="polite">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              Aguardando pagamento…
            </div>
            <button onClick={checkNow} disabled={checking} className="btn-ghost mt-1 w-full">
              {checking ? "Verificando…" : "Já paguei — verificar agora"}
            </button>
          </div>
        </section>
      )}

      {awaiting && !order.pixCopyPaste && (
        <section className="card p-6 text-center">
          <p className="font-bold">{order.pixError ? "Não conseguimos gerar o PIX agora. Tente novamente." : "Gerando seu PIX…"}</p>
          <button onClick={retryPix} disabled={retrying} className="btn-primary mt-4">
            {retrying ? "Tentando…" : "Tentar novamente"}
          </button>
        </section>
      )}

      {/* Pago */}
      {paid && (
        <section className="card p-5 text-center">
          <PixelArt sprite="star" className="mx-auto w-16" />
          <p className="mt-3 text-muted">
            Recebemos o pagamento de <b className="text-ink">{formatBRL(order.totalCents)}</b>. {order.requiresShipping ? "Agora vamos preparar o seu pedido." : ""}
          </p>
          {order.trackingCode && <p className="mt-2 text-sm">Código de rastreio: <b>{order.trackingCode}</b></p>}
          <p className="mt-2 text-sm font-semibold text-primary">{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL]}</p>
        </section>
      )}

      {paid && order.digital.length > 0 && (
        <section className="card p-5" aria-labelledby="digital-title">
          <h2 id="digital-title" className="flex items-center gap-2 text-lg font-extrabold">
            <PixelIcon name="download" className="h-5 w-5 text-primary" /> Conteúdo digital disponível
          </h2>
          <ul className="mt-3 space-y-2">
            {order.digital.map((d) => (
              <li key={d.token} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg p-3">
                <div>
                  <p className="font-bold">{d.name}</p>
                  {d.note && <p className="text-sm text-muted">{d.note}</p>}
                  {d.maxDownloads != null && <p className="text-xs text-muted">{d.downloads}/{d.maxDownloads} acessos usados</p>}
                </div>
                {d.available ? (
                  <a href={`/api/downloads/${d.token}`} target="_blank" rel="noopener" data-cta="digital_download" className="min-h-[44px] rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">
                    Acessar
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-muted">Liberação em breve</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Salve esta página nos favoritos para acessar de novo quando quiser.</p>
        </section>
      )}

      {paid && upsell && <UpsellOffer order={order} token={token} upsell={upsell} />}

      {order.parent && paid && (
        <Link href={`/pedido/${order.parent.orderNumber}?t=${order.parent.token}`} className="btn-light w-full">
          Voltar ao pedido principal
        </Link>
      )}

      <section className="card p-5">
        <h2 className="text-lg font-extrabold">Resumo</h2>
        <div className="mt-3"><Items order={order} /></div>
      </section>

      <div className="flex flex-col items-center gap-2 text-sm">
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-light w-full sm:w-auto">
            Falar com a {storeName} no WhatsApp
          </a>
        )}
        <Link href="/" className="btn-ghost">Voltar à loja</Link>
      </div>
    </div>
  );
}
