import "server-only";
import type { EmailType } from "@prisma/client";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { log } from "@/lib/log";
import { trackServerEvent } from "@/lib/analytics";
import { deliver, emailProvider } from "@/lib/email/provider";
import { getSettingsFresh, isOn, settingInt, type Settings } from "@/server/settings";
import { orderShippedEmail, pixRecoveryEmail, purchaseConfirmationEmail, type EmailBrand, type EmailOrder } from "@/emails/templates";
import { isAwaitingStatus, isPaidStatus } from "@/lib/domain";
import { formatCep } from "@/utils/format";

export const EMAIL_TYPE_LABEL: Record<EmailType, string> = {
  PURCHASE_CONFIRMATION: "Confirmação de compra",
  PIX_RECOVERY: "Lembrete de PIX pendente",
  ORDER_SHIPPED: "Pedido enviado",
};

async function loadOrder(orderId: string) {
  return db.order.findUnique({ where: { id: orderId }, include: { customer: true, items: true } });
}
type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

export function brandFromSettings(s: Settings): EmailBrand {
  const base = siteUrl();
  const digits = (s.whatsapp ?? "").replace(/\D/g, "");
  return {
    store: s.store_name || "Hama Beads",
    // Clientes de e-mail não exibem SVG/WebP: só usa o logo do admin se for PNG/JPG/GIF
    logoUrl: s.logo_url && /^https:\/\/.+\.(png|jpe?g|gif)(\?.*)?$/i.test(s.logo_url) ? s.logo_url : `${base}/email-logo.png`,
    siteUrl: base,
    primary: s.theme_primary || "#2F4BFF",
    secondary: s.theme_secondary || "#FFC53D",
    accent: s.theme_accent || "#FF4F8B",
    ink: s.theme_ink || "#17142E",
    background: s.theme_background || "#FFF9F0",
    whatsappUrl: digits.length >= 10 ? `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}` : null,
    contactEmail: s.contact_email || null,
    companyLine: [s.company_name, s.company_document ? `CNPJ ${s.company_document}` : ""].filter(Boolean).join(" · ") || null,
  };
}

export function toEmailOrder(o: LoadedOrder): EmailOrder {
  const a = o.shippingAddress as { street?: string; number?: string; complement?: string | null; district?: string; city?: string; state?: string; cep?: string } | null;
  return {
    orderNumber: o.orderNumber ?? o.id,
    firstName: o.customer.name.split(/\s+/)[0],
    items: o.items.map((i) => ({ name: i.productName, quantity: i.quantity, totalCents: i.totalPriceCents, kind: i.kind })),
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    hasDigital: o.items.some((i) => i.fulfillment !== "PHYSICAL"),
    requiresShipping: o.items.some((i) => i.fulfillment !== "DIGITAL"),
    pixCopyPaste: o.pixCopyPaste,
    pixExpiresAt: o.pixExpiresAt,
    trackingCode: o.trackingCode,
    address: a?.street ? `${a.street}, ${a.number}${a.complement ? ` — ${a.complement}` : ""} · ${a.district} · ${a.city}/${a.state} · ${formatCep(a.cep ?? "")}` : null,
  };
}

export const orderUrl = (o: { orderNumber: string | null; accessToken: string }) => `${siteUrl()}/pedido/${encodeURIComponent(o.orderNumber ?? "")}?t=${encodeURIComponent(o.accessToken)}`;

/** Descadastro dos lembretes (link no rodapé + List-Unsubscribe one-click, RFC 8058). */
export const unsubscribeUrl = (o: { orderNumber: string | null; accessToken: string }) =>
  `${siteUrl()}/api/email/unsubscribe?pedido=${encodeURIComponent(o.orderNumber ?? "")}&t=${encodeURIComponent(o.accessToken)}`;

export function renderEmail(type: EmailType, o: LoadedOrder, s: Settings): { subject: string; html: string; text: string; headers?: Record<string, string> } {
  const b = brandFromSettings(s);
  const data = toEmailOrder(o);
  const url = orderUrl(o);
  if (type === "PIX_RECOVERY") {
    const unsub = unsubscribeUrl(o);
    return { ...pixRecoveryEmail(b, data, url, unsub), headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
  }
  if (type === "ORDER_SHIPPED") return orderShippedEmail(b, data, url);
  return purchaseConfirmationEmail(b, data, url);
}

/** O e-mail ainda faz sentido no momento do envio? (evita lembrete de PIX já pago, por exemplo) */
function eligibility(type: EmailType, o: LoadedOrder, manual: boolean): string | null {
  if (type === "PIX_RECOVERY") {
    if (o.customer.emailOptOutAt) return "Cliente descadastrou dos lembretes";
    if (!isAwaitingStatus(o.status)) return `Pedido não está aguardando pagamento (${o.status})`;
    if (!o.pixCopyPaste) return "PIX não foi gerado";
    if (o.pixExpiresAt && o.pixExpiresAt < new Date()) return "PIX expirado";
  }
  if (type === "PURCHASE_CONFIRMATION" && !isPaidStatus(o.status)) return "Pedido não está pago";
  if (type === "ORDER_SHIPPED" && !manual && o.status !== "SHIPPED") return "Pedido não está como enviado";
  return null;
}

export async function scheduleEmail(orderId: string, type: EmailType, toEmail: string, delayMinutes: number) {
  const existing = await db.emailEvent.findFirst({ where: { orderId, type, triggeredBy: "system", status: { in: ["SCHEDULED", "SENDING", "SENT"] } } });
  if (existing) return existing; // um envio automático por tipo/pedido
  return db.emailEvent.create({ data: { orderId, type, toEmail, scheduledFor: new Date(Date.now() + delayMinutes * 60_000) } });
}

export async function cancelScheduled(orderId: string, type: EmailType, reason: string) {
  await db.emailEvent.updateMany({ where: { orderId, type, status: "SCHEDULED" }, data: { status: "CANCELLED", error: reason } });
}

/** Envia um EmailEvent (reserva atômica: nunca envia duas vezes o mesmo registro). */
export async function sendEmailEvent(id: string, opts: { manual?: boolean } = {}) {
  const claimed = await db.emailEvent.updateMany({ where: { id, status: { in: ["SCHEDULED", "FAILED"] } }, data: { status: "SENDING", attempts: { increment: 1 } } });
  if (!claimed.count) return { ok: false as const, error: "E-mail já processado" };
  const ev = await db.emailEvent.findUniqueOrThrow({ where: { id } });
  const order = await loadOrder(ev.orderId);
  if (!order) {
    await db.emailEvent.update({ where: { id }, data: { status: "SKIPPED", error: "Pedido não encontrado" } });
    return { ok: false as const, error: "Pedido não encontrado" };
  }
  const reason = eligibility(ev.type, order, Boolean(opts.manual));
  if (reason) {
    await db.emailEvent.update({ where: { id }, data: { status: "SKIPPED", error: reason } });
    return { ok: false as const, error: reason };
  }
  const s = await getSettingsFresh();
  const { subject, html, text, headers } = renderEmail(ev.type, order, s);
  const result = await deliver({ to: ev.toEmail, subject, html, text, headers, idempotencyKey: `hb-email-${ev.id}` }, s.contact_email || null);
  if (result.ok) {
    await db.emailEvent.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), subject, providerMessageId: result.id, error: null } });
    await trackServerEvent(order, ev.type === "PIX_RECOVERY" ? "email_recovery_sent" : ev.type === "PURCHASE_CONFIRMATION" ? "email_confirmation_sent" : "email_shipping_sent");
    log.info("email", "enviado", { type: ev.type, order: order.orderNumber });
    return { ok: true as const };
  }
  const giveUp = !result.retryable || ev.attempts >= 3;
  await db.emailEvent.update({ where: { id }, data: { status: giveUp ? "FAILED" : "SCHEDULED", error: result.error, subject, scheduledFor: new Date(Date.now() + 5 * 60_000) } });
  log.error("email", "falha no envio", { type: ev.type, order: order.orderNumber, error: result.error });
  return { ok: false as const, error: result.error };
}

async function sendNow(orderId: string, type: EmailType, triggeredBy: string, manual = false) {
  const order = await loadOrder(orderId);
  if (!order) return { ok: false as const, error: "Pedido não encontrado" };
  const ev = await db.emailEvent.create({ data: { orderId, type, toEmail: order.customer.email, triggeredBy } });
  return sendEmailEvent(ev.id, { manual });
}

/** Pagamento confirmado → confirmação imediata (e cancela o lembrete de PIX). */
export async function onOrderPaidEmail(orderId: string, email: string) {
  await cancelScheduled(orderId, "PIX_RECOVERY", "Pedido pago");
  const s = await getSettingsFresh();
  if (!isOn(s.email_confirmation_enabled)) return;
  const ev = await scheduleEmail(orderId, "PURCHASE_CONFIRMATION", email, 0);
  if (ev.status === "SCHEDULED" && emailProvider() !== "none") await sendEmailEvent(ev.id).catch(() => null);
}

/** PIX gerado → agenda o lembrete (padrão 10 min). Cancelado automaticamente se o pedido for pago. */
export async function onPixGeneratedEmail(orderId: string, email: string) {
  const s = await getSettingsFresh();
  if (!isOn(s.email_recovery_enabled)) return;
  await scheduleEmail(orderId, "PIX_RECOVERY", email, Math.max(1, settingInt(s, "email_recovery_delay_minutes", 10)));
}

/** Admin marcou como enviado → aviso com rastreio (se ativo). */
export async function onOrderShippedEmail(orderId: string) {
  const s = await getSettingsFresh();
  if (!isOn(s.email_shipping_enabled)) return;
  const order = await db.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) return;
  const ev = await scheduleEmail(orderId, "ORDER_SHIPPED", order.customer.email, 0);
  if (ev.status === "SCHEDULED" && emailProvider() !== "none") await sendEmailEvent(ev.id).catch(() => null);
}

/** Reenvio manual pelo admin (anti-spam: 2 min entre envios do mesmo tipo). */
export async function resendEmail(orderId: string, type: EmailType, adminId: string) {
  const recent = await db.emailEvent.findFirst({ where: { orderId, type, status: { in: ["SENT", "SENDING"] }, updatedAt: { gte: new Date(Date.now() - 2 * 60_000) } } });
  if (recent) return { ok: false as const, error: "Este e-mail foi enviado há menos de 2 minutos. Aguarde para reenviar." };
  if (emailProvider() === "none") return { ok: false as const, error: "E-mail não configurado: defina RESEND_API_KEY e EMAIL_FROM na Vercel." };
  return sendNow(orderId, type, `admin:${adminId}`, true);
}

/** Processa e-mails agendados vencidos (jobs/cron e execução oportunista). */
export async function processDueEmails(limit = 25) {
  if (emailProvider() === "none") return { processed: 0, sent: 0, skipped: 0, disabled: true };
  await db.emailEvent.updateMany({ where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - 10 * 60_000) } }, data: { status: "SCHEDULED" } });
  const due = await db.emailEvent.findMany({ where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } }, orderBy: { scheduledFor: "asc" }, take: limit, select: { id: true } });
  let sent = 0;
  let skipped = 0;
  for (const e of due) {
    const r = await sendEmailEvent(e.id);
    if (r.ok) sent++;
    else skipped++;
  }
  return { processed: due.length, sent, skipped };
}
