import { NextResponse, type NextRequest } from "next/server";
import type { EmailType } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandFromSettings, EMAIL_TYPE_LABEL, renderEmail } from "@/lib/email";
import { orderShippedEmail, pixRecoveryEmail, purchaseConfirmationEmail } from "@/emails/templates";
import { SAMPLE_ORDER } from "@/emails/sample";
import { siteUrl } from "@/lib/env";
import { getSettingsFresh } from "@/server/settings";

export const dynamic = "force-dynamic";


/** Prévia dos e-mails no admin: ?type=PURCHASE_CONFIRMATION|PIX_RECOVERY|ORDER_SHIPPED&order=<id opcional> */
export async function GET(req: NextRequest) {
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const type = (req.nextUrl.searchParams.get("type") ?? "PURCHASE_CONFIRMATION") as EmailType;
  if (!(type in EMAIL_TYPE_LABEL)) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  const s = await getSettingsFresh();
  const orderId = req.nextUrl.searchParams.get("order");
  const order = orderId ? await db.order.findUnique({ where: { id: orderId }, include: { customer: true, items: true } }) : null;

  let email: { subject: string; html: string };
  if (order) email = renderEmail(type, order, s);
  else {
    const b = brandFromSettings(s);
    const url = `${siteUrl()}/pedido/${SAMPLE_ORDER.orderNumber}?t=exemplo`;
    email = type === "PIX_RECOVERY" ? pixRecoveryEmail(b, SAMPLE_ORDER, url) : type === "ORDER_SHIPPED" ? orderShippedEmail(b, SAMPLE_ORDER, url) : purchaseConfirmationEmail(b, SAMPLE_ORDER, url);
  }
  const banner = `<div style="font-family:system-ui;background:#17142E;color:#fff;padding:8px 12px;font-size:13px">Prévia · Assunto: <b>${email.subject.replace(/</g, "&lt;")}</b></div>`;
  return new NextResponse(banner + email.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
