"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bravopayMode, isProductionDeploy } from "@/lib/env";
import { signWebhookPayload } from "@/lib/payments/bravopay";
import { isAwaitingStatus, isPaidStatus, ORDER_STATUS_LABEL } from "@/lib/domain";
import { withAdmin, type ActionResult } from "@/server/admin/guard";
import { optStr, str } from "@/server/admin/forms";
import { logOrderEvent, syncOrder } from "@/server/orders";
import { handleBravopayWebhook } from "@/server/webhooks";

const FULFILLMENT = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/** Etapas de entrega — só para pedidos com pagamento confirmado. "Pago" nunca é definido manualmente. */
export async function updateFulfillment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
  const id = str(fd, "id", 40);
  const next = str(fd, "status", 20) as (typeof FULFILLMENT)[number];
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (!isPaidStatus(order.status)) return { error: "Somente pedidos pagos podem avançar na entrega." };
  if (!FULFILLMENT.includes(next)) return { error: "Status inválido." };
  const trackingCode = optStr(fd, "trackingCode", 80);
  const notes = optStr(fd, "notes", 2000);
  const now = new Date();
  const updated = await db.order.update({
    where: { id },
    data: {
      status: next,
      trackingCode,
      notes,
      ...(next === "SHIPPED" && !order.shippedAt ? { shippedAt: now } : {}),
      ...(next === "DELIVERED" && !order.deliveredAt ? { deliveredAt: now } : {}),
    },
  });
  if (order.status !== next) await logOrderEvent(id, "fulfillment", `${ORDER_STATUS_LABEL[order.status]} → ${ORDER_STATUS_LABEL[next]} (admin ${admin.email})`, undefined, next);
  await audit(admin.id, "order_updated", "order", id, {
    summary: `Pedido ${order.orderNumber}: ${ORDER_STATUS_LABEL[order.status]} → ${ORDER_STATUS_LABEL[next]}`,
    before: { status: order.status, trackingCode: order.trackingCode, notes: order.notes },
    after: { status: updated.status, trackingCode: updated.trackingCode, notes: updated.notes },
  });
  revalidatePath(`/admin/pedidos/${id}`);
  return { ok: true, message: "Pedido atualizado." };
  });
}

export async function cancelOrder(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("ADMIN", async (admin) => {
  const id = str(fd, "id", 40);
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (!isAwaitingStatus(order.status)) return { error: "Somente pedidos aguardando pagamento podem ser cancelados aqui. Reembolsos são feitos no painel BravoPay." };
  const moved = await db.order.updateMany({ where: { id, status: order.status }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  if (!moved.count) return { error: "O status do pedido mudou. Recarregue a página." };
  await logOrderEvent(id, "status_change", `${order.status} → CANCELLED (admin ${admin.email})`, undefined, "CANCELLED");
  await audit(admin.id, "order_cancelled", "order", id, { summary: `Pedido ${order.orderNumber} cancelado`, before: { status: order.status }, after: { status: "CANCELLED" } });
  revalidatePath(`/admin/pedidos/${id}`);
  return { ok: true, message: "Pedido cancelado." };
  });
}

/** Consulta o status real na BravoPay (não altera nada se o gateway não confirmar). */
export async function recheckPayment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
  const id = str(fd, "id", 40);
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  const after = await syncOrder(order, { minIntervalMs: 0, source: "admin" });
  await audit(admin.id, "order_rechecked", "order", id, { summary: `Consulta ao gateway: ${order.orderNumber} (${order.status} → ${after.status})` });
  revalidatePath(`/admin/pedidos/${id}`);
  return { ok: true, message: after.status === order.status ? "Consulta feita — sem mudança de status." : `Status atualizado: ${ORDER_STATUS_LABEL[after.status]}.` };
  });
}

/**
 * SOMENTE em desenvolvimento/modo mock: envia um webhook assinado "transaction.paid"
 * pelo mesmo caminho de produção (validação de assinatura + idempotência).
 */
export async function simulatePayment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("ADMIN", async (admin) => {
  if (isProductionDeploy() || bravopayMode() !== "mock") return { error: "Disponível apenas no modo de teste (BRAVOPAY_MODE=mock)." };
  const secret = process.env.BRAVOPAY_WEBHOOK_SECRET;
  if (!secret) return { error: "Defina BRAVOPAY_WEBHOOK_SECRET para simular o webhook." };
  const order = await db.order.findUniqueOrThrow({ where: { id: str(fd, "id", 40) } });
  if (!order.transactionId) return { error: "Pedido sem PIX gerado." };
  const body = JSON.stringify({
    id: `evt_sim_${order.id}_${Date.now()}`,
    type: "transaction.paid",
    created: Math.floor(Date.now() / 1000),
    data: { id: order.transactionId, status: "PAID", method: "PIX", amount_cents: order.totalCents, fee_cents: null, net_cents: null, external_reference: order.externalReference, paid_at: new Date().toISOString() },
  });
  const headers = new Headers({ "bravopay-signature": signWebhookPayload(body, secret) });
  const result = await handleBravopayWebhook(body, headers);
  await audit(admin.id, "payment_simulated", "order", order.id, { summary: `Pagamento simulado (modo teste) ${order.orderNumber}` });
  revalidatePath(`/admin/pedidos/${order.id}`);
  return result.status === 200 ? { ok: true, message: "Webhook simulado processado." } : { error: `Falha: ${JSON.stringify(result.body)}` };
  });
}
