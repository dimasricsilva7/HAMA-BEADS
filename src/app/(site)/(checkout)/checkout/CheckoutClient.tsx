"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { QtyStepper } from "@/components/cart/CartDrawer";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { PixelIcon } from "@/components/ui/PixelArt";
import { gaEvent, getClientContext, metaEvent, newEventId, randomId, track, trackOnce } from "@/lib/client/tracking";
import { formatBRL } from "@/utils/format";
import { maskCep, maskCpf, maskPhone, onlyDigits, UF_LIST } from "@/utils/validators";
import type { CartQuote } from "@/types/catalog";

type Form = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};
const EMPTY: Form = { name: "", email: "", phone: "", cpf: "", cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" };
const FORM_KEY = "hb_checkout_form";
const TOKEN_KEY = "hb_checkout_token";

function Field({ id, label, error, children, className = "" }: { id: string; label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Summary({ q, compact = false }: { q: CartQuote; compact?: boolean }) {
  return (
    <div className="space-y-2 text-sm">
      {!compact &&
        q.lines.map((l) => (
          <div key={`${l.kind}-${l.productId}`} className="flex justify-between gap-3">
            <span className="text-muted">
              {l.quantity}× {l.name}
              {l.kind === "ORDER_BUMP" && <span className="ml-1 rounded bg-accent/15 px-1 text-[11px] font-bold text-accent">adicional</span>}
            </span>
            <span className="shrink-0 tabular-nums">{formatBRL(l.totalCents)}</span>
          </div>
        ))}
      <div className="flex justify-between border-t border-line pt-2">
        <span className="text-muted">Subtotal</span>
        <span className="tabular-nums">{formatBRL(q.subtotalCents)}</span>
      </div>
      {q.discountCents > 0 && (
        <div className="flex justify-between text-success">
          <span>Desconto{q.coupon?.code ? ` (${q.coupon.code})` : ""}</span>
          <span className="tabular-nums">− {formatBRL(q.discountCents)}</span>
        </div>
      )}
      {q.shippingCents > 0 && (
        <div className="flex justify-between">
          <span className="text-muted">Frete</span>
          <span className="tabular-nums">{formatBRL(q.shippingCents)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-line pt-2">
        <span className="font-bold">Total</span>
        <span className="font-display text-2xl font-extrabold tabular-nums">{formatBRL(q.totalCents)}</span>
      </div>
    </div>
  );
}

export function CheckoutClient({ requireCpf, checkoutNote, shippingNote, consentLabel }: { requireCpf: boolean; checkoutNote: string | null; shippingNote: string | null; consentLabel: string }) {
  const cart = useCart();
  const router = useRouter();
  const q = cart.quote;
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const started = useRef(false);

  // Dados do formulário guardados apenas nesta aba (sessionStorage)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(FORM_KEY) ?? "null");
      if (saved) setForm({ ...EMPTY, ...saved });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  // checkout_started + InitiateCheckout (uma vez, quando o orçamento chega)
  useEffect(() => {
    if (!q || started.current || !q.lines.length) return;
    started.current = true;
    const main = q.lines.find((l) => l.kind !== "ORDER_BUMP");
    metaEvent(
      "InitiateCheckout",
      { value: q.totalCents / 100, currency: "BRL", num_items: q.lines.reduce((s, l) => s + l.quantity, 0), content_ids: q.lines.map((l) => l.slug), content_type: "product" },
      { mirror: true, internal: { name: "checkout_started", productId: main?.productId ?? null, valueCents: q.totalCents } }
    );
    gaEvent("begin_checkout", { currency: "BRL", value: q.totalCents / 100, items: q.lines.map((l) => ({ item_id: l.slug, item_name: l.name, price: l.unitPriceCents / 100, quantity: l.quantity })) });
  }, [q]);

  useEffect(() => {
    q?.bumps.forEach((b) => trackOnce(`bump:${b.id}`, "order_bump_view", { productId: b.productId, element: `bump_${b.id}`, valueCents: b.priceCents, props: { bumpId: b.id } }));
  }, [q]);

  useEffect(() => {
    if (q?.coupon && !q.coupon.valid) setErrors((e) => ({ ...e, couponCode: q.coupon?.message ?? "Cupom inválido" }));
    if (q?.coupon?.valid) {
      setErrors(({ couponCode: _c, ...rest }) => rest);
      track("coupon_applied", { valueCents: q.discountCents, props: { code: q.coupon.code } });
    }
  }, [q?.coupon, q?.discountCents]);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k] || errors[`customer.${k}`] || errors[`address.${k}`]) setErrors(({ [k]: _a, [`customer.${k}`]: _b, [`address.${k}`]: _c, ...rest }) => rest);
  };

  async function lookupCep(raw: string) {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await res.json();
      if (!j.erro) setForm((f) => ({ ...f, street: j.logradouro || f.street, district: j.bairro || f.district, city: j.localidade || f.city, state: j.uf || f.state }));
      else setErrors((e) => ({ ...e, cep: "CEP não encontrado. Confira ou preencha o endereço." }));
    } catch {
      /* preenchimento manual */
    } finally {
      setCepLoading(false);
    }
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) e.name = "Informe nome e sobrenome";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "E-mail inválido";
    if (onlyDigits(form.phone).length < 10) e.phone = "WhatsApp inválido";
    if (requireCpf && onlyDigits(form.cpf).length !== 11) e.cpf = "Informe seu CPF";
    if (q?.requiresShipping) {
      if (onlyDigits(form.cep).length !== 8) e.cep = "CEP inválido";
      if (!form.street.trim()) e.street = "Informe o endereço";
      if (!form.number.trim()) e.number = "Informe o número";
      if (!form.district.trim()) e.district = "Informe o bairro";
      if (!form.city.trim()) e.city = "Informe a cidade";
      if (!form.state) e.state = "Selecione a UF";
    }
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!q || submitting) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setFormError("Confira os campos destacados.");
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setFormError(null);
    setSubmitting(true);
    // Token de idempotência ligado ao conteúdo do carrinho: repetir o envio do mesmo
    // carrinho reaproveita o pedido; carrinho alterado gera um pedido novo.
    const sig = JSON.stringify([cart.items, cart.bumpIds, cart.couponCode, form.email]);
    let token = "";
    try {
      const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "null") as { token: string; sig: string } | null;
      if (saved?.sig === sig) token = saved.token;
    } catch {
      /* ignore */
    }
    if (!token) {
      token = randomId(32);
      try {
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, sig }));
      } catch {
        /* ignore */
      }
    }
    const paymentEventId = newEventId("addpaymentinfo");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutToken: token,
          customer: { name: form.name, email: form.email, phone: form.phone, cpf: form.cpf || null },
          address: q.requiresShipping ? { cep: form.cep, street: form.street, number: form.number, complement: form.complement || null, district: form.district, city: form.city, state: form.state } : null,
          items: cart.items,
          bumpIds: cart.bumpIds,
          couponCode: cart.couponCode,
          marketingConsent: consent,
          paymentEventId,
          context: getClientContext(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.fields) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.fields as Record<string, string>)) mapped[k.replace(/^(customer|address)\./, "")] = v;
          setErrors(mapped);
        }
        if (res.status === 409) cart.refresh();
        // Pedido criado mas PIX falhou: mantém o token para não duplicar o pedido na nova tentativa
        throw new Error(json.error ?? "Não conseguimos gerar o PIX agora. Tente novamente.");
      }
      metaEvent("AddPaymentInfo", { value: json.totalCents / 100, currency: "BRL", payment_type: "pix" }, { eventId: paymentEventId });
      gaEvent("add_payment_info", { currency: "BRL", value: json.totalCents / 100, payment_type: "pix" });
      try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(FORM_KEY);
      } catch {
        /* ignore */
      }
      cart.clear();
      router.push(`/pedido/${json.orderNumber}?t=${json.token}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não conseguimos gerar o PIX agora. Tente novamente.");
      setSubmitting(false);
    }
  }

  if (cart.ready && !cart.items.length) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <h1 className="h-section">Seu carrinho está vazio</h1>
        <p className="lead mt-3">Escolha um kit para começar a criar.</p>
        <Link href="/#kits" className="btn-primary mt-8">
          Escolher meu kit
        </Link>
      </div>
    );
  }
  if (!q) {
    return (
      <div className="container-page max-w-2xl space-y-4 py-10" aria-busy="true" aria-label="Carregando checkout">
        {cart.error ? (
          <div className="rounded-2xl bg-danger/10 p-4 text-center">
            <p className="font-semibold text-danger">{cart.error}</p>
            <button onClick={cart.refresh} className="btn-light mt-3">Tentar novamente</button>
          </div>
        ) : (
          [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-card bg-ink/5" />)
        )}
      </div>
    );
  }

  const productLines = q.lines.filter((l) => l.kind !== "ORDER_BUMP");
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});

  return (
    <form onSubmit={submit} noValidate className="container-page grid gap-6 py-6 sm:py-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
      <div className="space-y-5">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Finalizar compra</h1>

        {/* Resumo imediato (mobile) */}
        <section className="card p-4 lg:hidden">
          <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={summaryOpen}>
            <span className="font-bold">
              {summaryOpen ? "Ocultar" : "Ver"} resumo ({q.lines.reduce((s, l) => s + l.quantity, 0)} {q.lines.length === 1 ? "item" : "itens"})
            </span>
            <span className="font-display text-xl font-extrabold tabular-nums">{formatBRL(q.totalCents)}</span>
          </button>
          {summaryOpen && <div className="mt-4"><Summary q={q} /></div>}
        </section>

        {/* Itens */}
        <section className="card p-4 sm:p-5" aria-labelledby="h-itens">
          <h2 id="h-itens" className="text-lg font-extrabold">Seu pedido</h2>
          {q.removed.length > 0 && <p className="mt-2 rounded-xl bg-warning/10 px-3 py-2 text-sm">Removemos itens indisponíveis: {q.removed.join(", ")}.</p>}
          <ul className="mt-3 space-y-3">
            {productLines.map((l, i) => (
              <li key={l.productId} className="flex gap-3">
                <ProductVisual imageUrl={l.imageUrl} name={l.name} category={l.category} index={i} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{l.name}</p>
                  <p className="text-sm text-muted">{formatBRL(l.unitPriceCents)}</p>
                  <div className="mt-1 flex items-center gap-3">
                    {l.fulfillment !== "DIGITAL" && <QtyStepper value={l.quantity} onChange={(n) => cart.setQuantity(l.productId, n)} label={l.name} />}
                    <button type="button" onClick={() => cart.remove(l.productId)} className="text-sm font-semibold text-muted underline-offset-2 hover:underline">
                      Remover
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-bold tabular-nums">{formatBRL(l.totalCents)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Order bumps — opcionais, desmarcados por padrão */}
        {q.bumps.length > 0 && (
          <section className="space-y-3" aria-label="Ofertas opcionais">
            {q.bumps.map((b) => {
              const selected = cart.bumpIds.includes(b.id);
              return (
              <label key={b.id} className={`flex cursor-pointer gap-3 rounded-card border-2 border-dashed p-4 transition ${selected ? "border-success bg-success/[0.06]" : "border-accent/60 bg-surface"}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    cart.toggleBump(b.id, e.target.checked);
                    track(e.target.checked ? "order_bump_accept" : "order_bump_reject", { productId: b.productId, element: `bump_${b.id}`, valueCents: b.priceCents, props: { bumpId: b.id } });
                  }}
                  className="mt-1 h-6 w-6 shrink-0 accent-[rgb(var(--c-success))]"
                  data-cta={`order_bump_${b.id}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-extrabold">{b.title}</span>
                    <span className="font-extrabold tabular-nums text-accent">
                      + {formatBRL(b.priceCents)}
                      {b.listPriceCents && <s className="ml-1 text-xs font-semibold text-muted">{formatBRL(b.listPriceCents)}</s>}
                    </span>
                  </span>
                  {b.description && <span className="mt-1 block text-sm text-muted">{b.description}</span>}
                  {b.benefit && <span className="mt-1 block text-sm font-semibold text-success">{b.benefit}</span>}
                  {selected && <span className="mt-2 block animate-pop text-sm font-bold text-success">✓ Adicionado ao pedido</span>}
                </span>
              </label>
              );
            })}
          </section>
        )}

        {/* Dados */}
        <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="h-dados">
          <h2 id="h-dados" className="text-lg font-extrabold">Seus dados</h2>
          <Field id="name" label="Nome completo" error={errors.name}>
            <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" className="input" {...inv("name")} />
          </Field>
          <Field id="phone" label="WhatsApp" error={errors.phone}>
            <input id="phone" value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} autoComplete="tel-national" inputMode="tel" placeholder="(11) 91234-5678" className="input" {...inv("phone")} />
          </Field>
          <Field id="email" label="E-mail" error={errors.email}>
            <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value.trim())} autoComplete="email" inputMode="email" className="input" {...inv("email")} />
          </Field>
          {requireCpf && (
            <Field id="cpf" label="CPF (exigido para o PIX)" error={errors.cpf}>
              <input id="cpf" value={form.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" className="input" {...inv("cpf")} />
            </Field>
          )}
        </section>

        {/* Entrega */}
        {q.requiresShipping && (
          <section className="card grid grid-cols-6 gap-4 p-4 sm:p-5" aria-labelledby="h-entrega">
            <h2 id="h-entrega" className="col-span-6 text-lg font-extrabold">Entrega</h2>
            {shippingNote && <p className="col-span-6 -mt-2 text-sm text-muted">{shippingNote}</p>}
            <Field id="cep" label={cepLoading ? "CEP (buscando…)" : "CEP"} error={errors.cep} className="col-span-6 sm:col-span-3">
              <input id="cep" value={form.cep} onChange={(e) => { set("cep", maskCep(e.target.value)); if (onlyDigits(e.target.value).length === 8) lookupCep(e.target.value); }} autoComplete="postal-code" inputMode="numeric" placeholder="00000-000" className="input" {...inv("cep")} />
            </Field>
            <Field id="street" label="Endereço" error={errors.street} className="col-span-6">
              <input id="street" value={form.street} onChange={(e) => set("street", e.target.value)} autoComplete="address-line1" className="input" {...inv("street")} />
            </Field>
            <Field id="number" label="Número" error={errors.number} className="col-span-2">
              <input id="number" value={form.number} onChange={(e) => set("number", e.target.value)} inputMode="numeric" className="input" {...inv("number")} />
            </Field>
            <Field id="complement" label="Complemento" className="col-span-4">
              <input id="complement" value={form.complement} onChange={(e) => set("complement", e.target.value)} autoComplete="address-line2" placeholder="Opcional" className="input" />
            </Field>
            <Field id="district" label="Bairro" error={errors.district} className="col-span-6 sm:col-span-3">
              <input id="district" value={form.district} onChange={(e) => set("district", e.target.value)} className="input" {...inv("district")} />
            </Field>
            <Field id="city" label="Cidade" error={errors.city} className="col-span-4 sm:col-span-2">
              <input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" className="input" {...inv("city")} />
            </Field>
            <Field id="state" label="UF" error={errors.state} className="col-span-2 sm:col-span-1">
              <select id="state" value={form.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1" className="input px-2" {...inv("state")}>
                <option value="">—</option>
                {UF_LIST.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
              </select>
            </Field>
          </section>
        )}

        {/* Cupom */}
        <section className="card p-4 sm:p-5">
          {!couponOpen && !cart.couponCode ? (
            <button type="button" onClick={() => setCouponOpen(true)} className="text-sm font-bold text-primary underline-offset-2 hover:underline">
              Tenho um cupom de desconto
            </button>
          ) : (
            <div>
              <label htmlFor="couponCode" className="label">Cupom</label>
              <div className="flex gap-2">
                <input id="couponCode" value={couponInput || cart.couponCode || ""} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="input uppercase" autoComplete="off" {...inv("couponCode")} />
                {cart.couponCode ? (
                  <button type="button" onClick={() => { cart.setCoupon(null); setCouponInput(""); setErrors(({ couponCode: _c, ...r }) => r); }} className="min-h-[52px] shrink-0 rounded-2xl border-2 border-line px-4 text-sm font-bold">
                    Remover
                  </button>
                ) : (
                  <button type="button" onClick={() => couponInput && cart.setCoupon(couponInput)} className="min-h-[52px] shrink-0 rounded-2xl bg-ink px-4 text-sm font-bold text-white">
                    Aplicar
                  </button>
                )}
              </div>
              {errors.couponCode && <p id="couponCode-error" className="mt-1 text-sm font-semibold text-danger">{errors.couponCode}</p>}
              {q.coupon?.valid && <p className="mt-1 text-sm font-semibold text-success">Cupom aplicado: − {formatBRL(q.discountCents)}</p>}
            </div>
          )}
        </section>

        {/* Pagamento */}
        <section className="card p-4 sm:p-5" aria-labelledby="h-pagamento">
          <h2 id="h-pagamento" className="text-lg font-extrabold">Pagamento</h2>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-success bg-success/[0.06] p-4">
            <PixelIcon name="pix" className="h-8 w-8 shrink-0 text-success" />
            <div>
              <p className="font-extrabold">PIX</p>
              <p className="text-sm text-muted">Geramos o QR Code e o código copia e cola na próxima tela. A confirmação é automática.</p>
            </div>
          </div>
          {checkoutNote && <p className="mt-3 text-sm text-muted">{checkoutNote}</p>}
        </section>

        <label className="flex cursor-pointer items-start gap-3 px-1 text-sm text-muted">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{consentLabel}</span>
        </label>

        {formError && (
          <p className="rounded-2xl bg-danger/10 px-4 py-3 font-semibold text-danger" role="alert">
            {formError}
          </p>
        )}

        <div className="lg:hidden">
          <button type="submit" disabled={submitting || cart.loading} data-cta="checkout_submit" className="btn-primary w-full">
            {submitting ? "Gerando PIX…" : `Gerar PIX · ${formatBRL(q.totalCents)}`}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            Ao continuar, você concorda com os <Link href="/termos" className="underline">Termos</Link> e a <Link href="/politica-de-privacidade" className="underline">Política de Privacidade</Link>.
          </p>
        </div>
      </div>

      <aside className="hidden lg:sticky lg:top-6 lg:block">
        <div className="card p-5">
          <h2 className="text-lg font-extrabold">Resumo</h2>
          <div className="mt-4">
            <Summary q={q} />
          </div>
          <button type="submit" disabled={submitting || cart.loading} data-cta="checkout_submit" className="btn-primary mt-5 w-full">
            {submitting ? "Gerando PIX…" : "Gerar PIX"}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Ao continuar, você concorda com os <Link href="/termos" className="underline">Termos</Link> e a <Link href="/politica-de-privacidade" className="underline">Política de Privacidade</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}
