/**
 * Templates de e-mail no visual da loja (creme, tinta, azul primário, faixa pixel,
 * logo em pixel art). HTML de tabelas com estilos inline para Gmail/Outlook/Apple Mail.
 * Cores vêm de Admin → Configurações → Aparência.
 */

export type EmailBrand = {
  store: string;
  logoUrl: string;
  siteUrl: string;
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  background: string;
  whatsappUrl: string | null;
  contactEmail: string | null;
  companyLine: string | null;
};

export type EmailOrder = {
  orderNumber: string;
  firstName: string;
  items: { name: string; quantity: number; totalCents: number; kind: string }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  hasDigital: boolean;
  requiresShipping: boolean;
  pixCopyPaste: string | null;
  pixExpiresAt: Date | null;
  trackingCode: string | null;
  address: string | null;
};

const brl = (c: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100).replace(/ /g, " ");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONT = "'Bricolage Grotesque','Plus Jakarta Sans',Arial,Helvetica,sans-serif";
const BODY = "'Plus Jakarta Sans',Arial,Helvetica,sans-serif";
const MUTED = "#625E7A";
const LINE = "#E8E2D6";

function button(b: EmailBrand, href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 8px"><tr><td align="center" bgcolor="${b.primary}" style="border-radius:16px;border-bottom:4px solid ${b.ink}">
<a href="${href}" target="_blank" style="display:block;padding:16px 24px;font-family:${BODY};font-size:15px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:16px">${esc(label)}</a></td></tr></table>`;
}

function pixelStripe(b: EmailBrand) {
  const colors = [b.primary, b.secondary, b.accent, "#1A9E5F"];
  const cells = Array.from({ length: 16 }, (_, i) => `<td height="6" style="background:${colors[i % 4]};font-size:0;line-height:0">&nbsp;</td>`).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${cells}</tr></table>`;
}

function itemsTable(o: EmailOrder) {
  const rows = o.items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:${BODY};font-size:14px;color:#17142E">${i.quantity}× ${esc(i.name)}${i.kind === "ORDER_BUMP" ? ` <span style="color:${MUTED};font-size:12px">(adicional)</span>` : ""}</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:${BODY};font-size:14px;color:#17142E;white-space:nowrap">${brl(i.totalCents)}</td></tr>`
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0 0;font-family:${BODY};font-size:${bold ? 16 : 14}px;color:${bold ? "#17142E" : MUTED};font-weight:${bold ? 800 : 400}">${label}</td><td align="right" style="padding:6px 0 0;font-family:${bold ? FONT : BODY};font-size:${bold ? 20 : 14}px;color:#17142E;font-weight:${bold ? 800 : 400};white-space:nowrap">${value}</td></tr>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px">${rows}
${o.discountCents > 0 || o.shippingCents > 0 ? line("Subtotal", brl(o.subtotalCents)) : ""}
${o.discountCents > 0 ? line("Desconto", `− ${brl(o.discountCents)}`) : ""}
${o.shippingCents > 0 ? line("Frete", brl(o.shippingCents)) : ""}
${line("Total", brl(o.totalCents), true)}</table>`;
}

function layout(b: EmailBrand, opts: { preheader: string; eyebrow: string; title: string; body: string; footerNote: string; unsubscribeUrl?: string }) {
  const contact = [
    b.whatsappUrl ? `<a href="${b.whatsappUrl}" style="color:${b.primary};text-decoration:none;font-weight:700">WhatsApp</a>` : "",
    b.contactEmail ? `<a href="mailto:${esc(b.contactEmail)}" style="color:${b.primary};text-decoration:none;font-weight:700">${esc(b.contactEmail)}</a>` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${b.background}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${b.background}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
<tr><td align="center" style="padding:4px 0 20px"><a href="${b.siteUrl}" target="_blank"><img src="${b.logoUrl}" alt="${esc(b.store)}" width="216" height="40" style="display:block;width:216px;height:40px;border:0;outline:none"></a></td></tr>
<tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:24px;overflow:hidden">
${pixelStripe(b)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding:28px 24px 24px">
<p style="margin:0;font-family:${BODY};font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${b.primary}">${esc(opts.eyebrow)}</p>
<h1 style="margin:8px 0 0;font-family:${FONT};font-size:28px;line-height:1.1;font-weight:800;color:${b.ink}">${esc(opts.title)}</h1>
${opts.body}
</td></tr></table></td></tr>
<tr><td align="center" style="padding:20px 12px 0;font-family:${BODY};font-size:12px;line-height:1.6;color:${MUTED}">
${contact ? `Dúvidas? Fale com a gente: ${contact}<br>` : ""}${esc(opts.footerNote)}<br>
<a href="${b.siteUrl}/politica-de-privacidade" style="color:${MUTED}">Privacidade</a> · <a href="${b.siteUrl}/trocas-e-devolucoes" style="color:${MUTED}">Trocas e devoluções</a>
${b.companyLine ? `<br>${esc(b.companyLine)}` : ""}${opts.unsubscribeUrl ? `<br><a href="${opts.unsubscribeUrl}" style="color:${MUTED}">Não quero receber lembretes de pagamento</a>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

const p = (html: string, style = "") => `<p style="margin:14px 0 0;font-family:${BODY};font-size:15px;line-height:1.6;color:#17142E;${style}">${html}</p>`;

export function purchaseConfirmationEmail(b: EmailBrand, o: EmailOrder, orderUrl: string) {
  const subject = `Pagamento confirmado — pedido ${o.orderNumber}`;
  const body = `${p(`Oi, ${esc(o.firstName)}! Recebemos o pagamento do seu pedido <b>${esc(o.orderNumber)}</b>. Obrigado por comprar com a ${esc(b.store)}!`)}
${o.hasDigital ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px"><tr><td style="background:#FFF4D6;border-radius:16px;padding:14px 16px;font-family:${BODY};font-size:14px;line-height:1.5;color:#17142E"><b>Seus modelos digitais já estão liberados.</b><br>Acesse pela página do pedido — o link fica salvo para você voltar quando quiser.</td></tr></table>` : ""}
${itemsTable(o)}
${o.requiresShipping ? p(`<b>Próximos passos:</b> agora vamos separar e preparar o seu kit. Você recebe o código de rastreio por aqui assim que ele for enviado.${o.address ? `<br><span style="color:${MUTED};font-size:13px">Entrega em: ${esc(o.address)}</span>` : ""}`) : ""}
${button(b, orderUrl, o.hasDigital ? "Ver pedido e acessar modelos" : "Acompanhar meu pedido")}`;
  const text = `Pagamento confirmado!\n\nOi, ${o.firstName}! Recebemos o pagamento do pedido ${o.orderNumber}.\n\n${o.items.map((i) => `${i.quantity}x ${i.name} — ${brl(i.totalCents)}`).join("\n")}\nTotal: ${brl(o.totalCents)}\n\n${o.hasDigital ? "Seus modelos digitais já estão liberados na página do pedido.\n" : ""}Acompanhe: ${orderUrl}\n\n${b.store}`;
  return { subject, html: layout(b, { preheader: `Recebemos o pagamento de ${brl(o.totalCents)}. Veja os detalhes do pedido.`, eyebrow: "Pagamento confirmado", title: "Seu kit está garantido!", body, footerNote: `Você recebeu este e-mail porque fez uma compra na ${b.store}.` }), text };
}

export function pixRecoveryEmail(b: EmailBrand, o: EmailOrder, orderUrl: string, unsubscribeUrl?: string) {
  const subject = `Seu pedido ${o.orderNumber} está aguardando pagamento`;
  const expires = o.pixExpiresAt ? o.pixExpiresAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : null;
  const body = `${p(`Oi, ${esc(o.firstName)}! Vimos que o PIX do pedido <b>${esc(o.orderNumber)}</b> ainda não foi pago. Seu kit está reservado — é só concluir o pagamento pelo app do banco.`)}
${itemsTable(o)}
${button(b, orderUrl, `Pagar ${brl(o.totalCents)} com PIX`)}
${
  o.pixCopyPaste
    ? `<p style="margin:14px 0 6px;font-family:${BODY};font-size:13px;font-weight:700;color:#17142E">Ou copie o código PIX (copia e cola):</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="background:${b.background};border:2px dashed ${LINE};border-radius:14px;padding:12px;font-family:'Courier New',monospace;font-size:12px;line-height:1.4;color:#17142E;word-break:break-all">${esc(o.pixCopyPaste)}</td></tr></table>`
    : ""
}
${expires ? p(`O código vale até <b>${expires}</b>. A confirmação é automática assim que o pagamento cair. Se o código expirar, abra o pedido e toque em <b>Gerar novo PIX</b>.`, `font-size:13px;color:${MUTED}`) : ""}`;
  const text = `Oi, ${o.firstName}! O PIX do pedido ${o.orderNumber} (${brl(o.totalCents)}) ainda não foi pago.\n\nPague pelo link: ${orderUrl}\n${o.pixCopyPaste ? `\nPIX copia e cola:\n${o.pixCopyPaste}\n` : ""}\n${b.store}`;
  return { subject, html: layout(b, { preheader: "Seu kit está reservado. Conclua o pagamento em poucos segundos.", eyebrow: "Falta pouco", title: "Seu kit está te esperando", body, footerNote: `Você recebeu este e-mail porque iniciou um pedido na ${b.store}.`, unsubscribeUrl }), text };
}

export function orderShippedEmail(b: EmailBrand, o: EmailOrder, orderUrl: string) {
  const subject = `Pedido ${o.orderNumber} enviado`;
  const body = `${p(`Oi, ${esc(o.firstName)}! Seu pedido <b>${esc(o.orderNumber)}</b> saiu para entrega.`)}
${o.trackingCode ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px"><tr><td align="center" style="background:${b.background};border-radius:16px;padding:16px;font-family:${BODY};color:#17142E"><span style="font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:1.5px;font-weight:800">Código de rastreio</span><br><span style="font-family:${FONT};font-size:24px;font-weight:800;letter-spacing:1px">${esc(o.trackingCode)}</span></td></tr></table>` : ""}
${itemsTable(o)}
${button(b, orderUrl, "Acompanhar meu pedido")}`;
  const text = `Seu pedido ${o.orderNumber} foi enviado!${o.trackingCode ? `\nCódigo de rastreio: ${o.trackingCode}` : ""}\n\nAcompanhe: ${orderUrl}\n\n${b.store}`;
  return { subject, html: layout(b, { preheader: o.trackingCode ? `Código de rastreio: ${o.trackingCode}` : "Seu pedido saiu para entrega.", eyebrow: "Pedido enviado", title: "Seu kit está a caminho!", body, footerNote: `Você recebeu este e-mail porque fez uma compra na ${b.store}.` }), text };
}
