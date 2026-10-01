import Link from "next/link";
import { Badge, Card, Field, PageHeader, inputCls, textareaCls } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/client";
import { MediaInput } from "@/components/admin/inputs";
import { bravopayMode, envHealth, siteUrl } from "@/lib/env";
import { db } from "@/lib/db";
import { getSettingsFresh } from "@/server/settings";
import { saveSettings, saveTemplate, sendTestEmail } from "../sistema-actions";
import { emailProvider } from "@/lib/email/provider";

export const metadata = { title: "Configurações" };
type SP = Promise<{ aba?: string }>;

const TABS = { loja: "Loja", aparencia: "Aparência e layout", checkout: "Checkout", rastreamento: "Pixels e analytics", seo: "SEO", politicas: "Políticas", emails: "E-mails", mensagens: "Mensagens (WhatsApp)", sistema: "Sistema" } as const;

export default async function SettingsPage({ searchParams }: { searchParams: SP }) {
  const tab = ((await searchParams).aba ?? "loja") as keyof typeof TABS;
  const s = await getSettingsFresh();
  const text = (key: string, label: string, hint?: string, placeholder?: string) => (
    <Field label={label} hint={hint}><input name={key} defaultValue={s[key]} placeholder={placeholder} className={inputCls} /></Field>
  );
  const check = (key: string, label: string) => (
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name={key} defaultChecked={s[key] === "true"} className="h-4 w-4" /> {label}</label>
  );
  const form = (keys: string[], children: React.ReactNode) => (
    <ActionForm action={saveSettings} className="space-y-4">
      <input type="hidden" name="__keys" value={keys.join(",")} />
      {children}
      <SubmitButton>Salvar</SubmitButton>
    </ActionForm>
  );

  return (
    <div>
      <PageHeader title="Configurações" />
      <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="Abas">
        {Object.entries(TABS).map(([k, v]) => (
          <Link key={k} href={`?aba=${k}`} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${k === tab ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>{v}</Link>
        ))}
      </nav>

      {tab === "loja" && (
        <Card title="Dados da loja">
          {form(
            ["store_name", "store_tagline", "logo_url", "favicon_url", "company_name", "company_document", "contact_email", "contact_phone", "whatsapp", "address", "support_hours", "instagram_url", "tiktok_url", "facebook_url", "youtube_url"],
            <div className="grid gap-4 md:grid-cols-2">
              {text("store_name", "Nome da loja")}
              {text("store_tagline", "Frase curta")}
              <MediaInput name="logo_url" label="Logo" defaultValue={s.logo_url} folder="marca" />
              <MediaInput name="favicon_url" label="Favicon" defaultValue={s.favicon_url} folder="marca" />
              {text("company_name", "Razão social", "[PREENCHER] — exibida no rodapé")}
              {text("company_document", "CNPJ")}
              {text("contact_email", "E-mail de atendimento")}
              {text("contact_phone", "Telefone")}
              {text("whatsapp", "WhatsApp (com DDD)", "Usado nos botões de atendimento", "11912345678")}
              {text("support_hours", "Horário de atendimento")}
              {text("address", "Endereço")}
              {text("instagram_url", "Instagram (URL)")}
              {text("tiktok_url", "TikTok (URL)")}
              {text("facebook_url", "Facebook (URL)")}
              {text("youtube_url", "YouTube (URL)")}
            </div>
          )}
        </Card>
      )}

      {tab === "aparencia" && (
        <Card title="Aparência (tokens do design system) e layout">
          {form(
            ["theme_primary", "theme_secondary", "theme_accent", "theme_ink", "theme_background", "announcement_text", "header_cta_label", "sticky_cta_enabled", "sticky_cta_label", "footer_text"],
            <>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[["theme_primary", "Primária"], ["theme_secondary", "Secundária"], ["theme_accent", "Destaque"], ["theme_ink", "Texto"], ["theme_background", "Fundo"]].map(([k, l]) => (
                  <Field key={k} label={l}>
                    <span className="flex items-center gap-2">
                      <span className="h-10 w-10 shrink-0 rounded-lg border border-slate-300" style={{ background: s[k] }} />
                      <input name={k} defaultValue={s[k]} className={inputCls} />
                    </span>
                  </Field>
                ))}
              </div>
              <p className="text-xs text-slate-500">Mantenha bom contraste entre texto e fundo (WCAG AA). Botões usam a cor primária com texto branco.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {text("announcement_text", "Barra de aviso (topo)", "Vazio = oculta. Não use urgência falsa.")}
                {text("header_cta_label", "Botão do header")}
                {text("sticky_cta_label", "CTA fixo no mobile")}
                {text("footer_text", "Texto do rodapé")}
              </div>
              {check("sticky_cta_enabled", "Mostrar CTA fixo no mobile")}
            </>
          )}
        </Card>
      )}

      {tab === "checkout" && (
        <Card title="Checkout e pagamento">
          {form(
            ["require_cpf", "shipping_flat_cents", "shipping_note", "pix_expiration_minutes", "checkout_note", "marketing_consent_label"],
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">{check("require_cpf", "Exigir CPF (recomendado para PIX)")}</div>
              <Field label="Frete fixo (R$)" hint="0 = sem cobrança de frete. [PREENCHER] conforme a operação."><input name="shipping_flat_cents" defaultValue={(Number(s.shipping_flat_cents) / 100).toFixed(2).replace(".", ",")} className={inputCls} /></Field>
              {text("shipping_note", "Observação de entrega", "Ex.: prazo estimado — só informe prazos reais")}
              {text("pix_expiration_minutes", "Validade do PIX (minutos)")}
              {text("checkout_note", "Observação no pagamento")}
              <Field label="Texto do opt-in de marketing" className="md:col-span-2"><input name="marketing_consent_label" defaultValue={s.marketing_consent_label} className={inputCls} /></Field>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">Preços, bumps e upsells ficam em Produtos, Order bumps e Upsells.</p>
        </Card>
      )}

      {tab === "rastreamento" && (
        <Card title="Pixels e analytics">
          {form(
            ["meta_pixel_enabled", "meta_pixel_id", "meta_capi_enabled", "ga_enabled", "ga_id", "cookie_banner_enabled"],
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {text("meta_pixel_id", "Meta Pixel ID(s)", "Um ou mais IDs separados por vírgula (até 3). Vazio = NEXT_PUBLIC_META_PIXEL_ID")}
                {text("ga_id", "Google Analytics 4 (G-XXXX)", "Vazio = usa NEXT_PUBLIC_GA_ID")}
              </div>
              {check("meta_pixel_enabled", "Meta Pixel ativo (PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase)")}
              {check("meta_capi_enabled", `Conversions API ativa (tokens no servidor: META_CAPI_TOKENS por pixel ou META_ACCESS_TOKEN — ${process.env.META_CAPI_TOKENS || process.env.META_ACCESS_TOKEN ? "configurado" : "NÃO configurado"})`)}
              {check("ga_enabled", "GA4 ativo (page_view, view_item, add_to_cart, begin_checkout, add_payment_info, purchase)")}
              {check("cookie_banner_enabled", "Banner de consentimento de cookies (Pixel/GA só carregam após aceite)")}
              <p className="text-xs text-slate-500">Scripts arbitrários não são aceitos por segurança (XSS). Purchase só é enviado após o pagamento confirmado pelo gateway, com o mesmo event_id no Pixel e na CAPI (deduplicação).</p>
            </div>
          )}
        </Card>
      )}

      {tab === "seo" && (
        <Card title="SEO e compartilhamento">
          {form(
            ["seo_title", "seo_description", "og_image_url"],
            <div className="space-y-4">
              <Field label="Título padrão (até 60)"><input name="seo_title" maxLength={70} defaultValue={s.seo_title} className={inputCls} /></Field>
              <Field label="Descrição (até 160)"><textarea name="seo_description" maxLength={170} rows={3} defaultValue={s.seo_description} className={textareaCls} /></Field>
              <MediaInput name="og_image_url" label="Imagem de compartilhamento (1200×630)" defaultValue={s.og_image_url} folder="marca" />
              <p className="text-xs text-slate-500">Sem imagem, usamos uma gerada automaticamente ({siteUrl()}/og). Sitemap: {siteUrl()}/sitemap.xml</p>
            </div>
          )}
        </Card>
      )}

      {tab === "politicas" && (
        <Card title="Políticas (texto editável)">
          {form(
            ["policy_privacy", "policy_terms", "policy_returns", "policy_cookies"],
            <div className="space-y-4">
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Os textos iniciais são modelos genéricos marcados com [PREENCHER]. Revise com seu jurídico e inclua os dados reais da empresa.</p>
              {[["policy_privacy", "Política de Privacidade"], ["policy_terms", "Termos de Uso"], ["policy_returns", "Troca e Devolução"], ["policy_cookies", "Cookies"]].map(([k, l]) => (
                <Field key={k} label={l}><textarea name={k} rows={10} defaultValue={s[k]} className={`${textareaCls} font-mono text-xs`} /></Field>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "emails" && (
        <div className="space-y-6">
          <Card title="E-mails automáticos (Resend)">
            <p className="mb-4 text-sm">
              Status:{" "}
              {emailProvider() === "resend" ? <Badge tone="green">ativo — enviando por {process.env.EMAIL_FROM}</Badge> : <Badge tone="red">desativado — defina RESEND_API_KEY e EMAIL_FROM na Vercel</Badge>}
            </p>
            {form(
              ["email_confirmation_enabled", "email_recovery_enabled", "email_checkout_enabled", "email_recovery_delay_minutes", "email_shipping_enabled"],
              <div className="space-y-3">
                {check("email_confirmation_enabled", "Confirmação de compra — enviada assim que o pagamento é aprovado")}
                {check("email_recovery_enabled", "Lembrete de PIX pendente (carrinho abandonado) — cancelado automaticamente se o cliente pagar antes")}
                {check("email_checkout_enabled", "Checkout abandonado — para quem digitou o e-mail no checkout mas não gerou o PIX (com link que restaura o carrinho)")}
                <Field label="Enviar o lembrete após (minutos)" hint="Padrão 10. O PIX expira conforme Configurações → Checkout; o lembrete não é enviado se o PIX já tiver expirado.">
                  <input name="email_recovery_delay_minutes" inputMode="numeric" defaultValue={s.email_recovery_delay_minutes} className={`${inputCls} max-w-[140px]`} />
                </Field>
                {check("email_shipping_enabled", "Aviso de envio com código de rastreio — ao marcar o pedido como Enviado")}
              </div>
            )}
          </Card>
          <Card title="Prévia e teste">
            <p className="text-sm text-slate-600">Os templates usam o logo, as cores e os contatos das outras abas.</p>
            <p className="mt-2 flex flex-wrap gap-3 text-sm">
              <a className="font-semibold underline" target="_blank" href="/api/admin/email-preview?type=PURCHASE_CONFIRMATION">Confirmação de compra</a>
              <a className="font-semibold underline" target="_blank" href="/api/admin/email-preview?type=PIX_RECOVERY">Lembrete de PIX</a>
              <a className="font-semibold underline" target="_blank" href="/api/admin/email-preview?type=ORDER_SHIPPED">Pedido enviado</a>
            </p>
            <ActionForm action={sendTestEmail} className="mt-4 flex flex-wrap items-center gap-2">
              <select name="type" className={`${inputCls} w-auto`} aria-label="Template"><option value="PURCHASE_CONFIRMATION">Confirmação de compra</option><option value="PIX_RECOVERY">Lembrete de PIX</option></select>
              <SubmitButton pendingText="Enviando…">Enviar teste para o meu e-mail</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      )}
      {tab === "mensagens" && <TemplatesTab />}
      {tab === "sistema" && <SystemTab />}
    </div>
  );
}

async function TemplatesTab() {
  const templates = await db.messageTemplate.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Modelos para recuperação manual de PIX pendentes. Variáveis: {"{primeiro_nome} {loja} {pedido} {valor} {link}"}. Nada é enviado automaticamente.</p>
      {[...templates, null].map((t, i) => (
        <Card key={t?.id ?? `new-${i}`} title={t ? `${t.channel} · ${t.name}` : "Novo modelo"}>
          <ActionForm action={saveTemplate} resetOnSuccess={!t}>
            {t && <input type="hidden" name="id" value={t.id} />}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Canal"><select name="channel" defaultValue={t?.channel ?? "WHATSAPP"} className={inputCls}><option>WHATSAPP</option><option>EMAIL</option></select></Field>
              <Field label="Nome"><input name="name" defaultValue={t?.name ?? ""} className={inputCls} /></Field>
            </div>
            <Field label="Mensagem"><textarea name="body" rows={4} defaultValue={t?.body ?? ""} className={textareaCls} /></Field>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="active" defaultChecked={t?.active ?? true} className="h-4 w-4" /> Ativo</label>
            <SubmitButton>Salvar modelo</SubmitButton>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

function SystemTab() {
  const env = envHealth();
  const mode = bravopayMode();
  return (
    <div className="space-y-6">
      <Card title="Gateway de pagamento">
        <p className="text-sm">
          BravoPay: {mode === "live" ? <Badge tone="green">produção (API real)</Badge> : mode === "mock" ? <Badge tone="amber">modo de teste (PIX fictício)</Badge> : <Badge tone="red">desativado — checkout indisponível</Badge>}
        </p>
        <p className="mt-2 text-sm text-slate-600">Webhook a configurar no painel BravoPay: <code className="rounded bg-slate-100 px-1.5 py-0.5">{siteUrl()}/api/webhooks/bravopay</code></p>
        <p className="mt-1 text-xs text-slate-500">Eventos: transaction.created, paid, refunded, chargeback, expired, failed, receipt_uploaded. Assinatura HMAC-SHA256 obrigatória.</p>
      </Card>
      <Card title="Variáveis de ambiente (somente presença — valores nunca são exibidos)">
        <ul className="divide-y divide-slate-100 text-sm">
          {env.map((e) => (
            <li key={e.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span><code className="font-mono text-xs">{e.key}</code> <span className="text-slate-500">— {e.hint}</span></span>
              {e.ok ? <Badge tone="green">ok</Badge> : e.required ? <Badge tone="red">ausente</Badge> : <Badge>opcional</Badge>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
