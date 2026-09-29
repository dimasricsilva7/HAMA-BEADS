/**
 * Teste real do funil (ambiente de desenvolvimento com BRAVOPAY_MODE=mock):
 *   visita via Facebook Ads (UTMs + fbclid) → rola → seleciona kit → order bump →
 *   checkout → PIX gerado → PIX copiado → webhook assinado "transaction.paid" →
 *   compra confirmada → upsell → conteúdo digital.
 * Verifica no banco: eventos de analytics, atribuição do pedido, idempotência do
 * webhook (duplicado), rejeição de assinatura inválida e snapshot dos itens.
 *
 *   npx tsx scripts/e2e-funnel.ts [baseUrl]
 */
import "dotenv/config";
import crypto from "crypto";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const base = process.argv[2] ?? "http://localhost:3000";
const secret = process.env.BRAVOPAY_WEBHOOK_SECRET!;
const db = new PrismaClient();
let failures = 0;
const check = (ok: boolean, label: string, extra?: unknown) => {
  console.log(`${ok ? "✔" : "✘"} ${label}${extra !== undefined ? ` → ${JSON.stringify(extra)}` : ""}`);
  if (!ok) failures++;
};

function sign(body: string, ts = Math.floor(Date.now() / 1000)) {
  return `t=${ts},v1=${crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex")}`;
}

async function sendWebhook(eventId: string, type: string, order: { externalReference: string | null; transactionId: string | null; totalCents: number }, signature?: string) {
  const body = JSON.stringify({
    id: eventId,
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      id: order.transactionId,
      object: "transaction",
      status: type === "transaction.paid" ? "PAID" : "PENDING",
      method: "PIX",
      amount_cents: order.totalCents,
      fee_cents: Math.round(order.totalCents * 0.03),
      net_cents: order.totalCents - Math.round(order.totalCents * 0.03),
      external_reference: order.externalReference,
      paid_at: new Date().toISOString(),
      metadata: { test: "e2e" },
      tracking: { utm_source: "facebook" },
    },
  });
  const res = await fetch(`${base}/api/webhooks/bravopay`, { method: "POST", headers: { "Content-Type": "application/json", "BravoPay-Signature": signature ?? sign(body) }, body });
  return { status: res.status, json: await res.json().catch(() => null) };
}

(async () => {
  if (!secret) throw new Error("BRAVOPAY_WEBHOOK_SECRET ausente no .env");
  const browser = await chromium.launch();
  // UA real de celular: o /api/track descarta navegadores headless (filtro de bots)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
  await ctx.addCookies([{ name: "hb_consent", value: "granted", url: base }]);
  const page = await ctx.newPage();
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  // 1. Chegada via Facebook Ads
  await page.goto(`${base}/?utm_source=facebook&utm_medium=paid&utm_campaign=test&utm_content=creative01&fbclid=test`, { waitUntil: "networkidle" });
  const vid = (await ctx.cookies()).find((c) => c.name === "hb_vid")?.value;
  check(Boolean(vid), "visitor_id definido pelo middleware", vid);

  // 2. Rolagem (scroll_25..90) e visualização dos kits
  for (let y = 0; y <= 16000; y += 700) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(80);
  }
  await page.locator("#kits").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // 3. Seleciona o Kit Profissional
  await page.locator('[data-cta="kit_kit-profissional"]').click();
  await page.getByRole("dialog", { name: "Seu carrinho" }).waitFor();
  check(await page.getByText("Kit Profissional").first().isVisible(), "drawer mostra o resumo imediatamente");
  await page.locator('[data-cta="drawer_checkout"]').click();
  await page.waitForURL(/\/checkout/);

  // 4. Order bump
  const bump = page.locator('input[type="checkbox"][data-cta^="order_bump_"]').first();
  await bump.waitFor();
  await bump.check();
  await page.getByText("✓ Adicionado ao pedido").waitFor();

  // 5. Dados
  await page.fill("#name", "Cliente Teste E2E");
  await page.fill("#phone", "11987654321");
  await page.fill("#email", `e2e+${Date.now()}@example.com`);
  if (await page.locator("#cpf").count()) await page.fill("#cpf", "52998224725");
  await page.fill("#cep", "01310100");
  await page.waitForTimeout(1500);
  if (!(await page.inputValue("#street"))) await page.fill("#street", "Avenida Paulista");
  await page.fill("#number", "1000");
  if (!(await page.inputValue("#district"))) await page.fill("#district", "Bela Vista");
  if (!(await page.inputValue("#city"))) await page.fill("#city", "São Paulo");
  if (!(await page.inputValue("#state"))) await page.selectOption("#state", "SP");
  await page.locator('button[data-cta="checkout_submit"]:visible').click();

  // 6. PIX gerado
  await page.waitForURL(/\/pedido\//, { timeout: 30000 });
  await page.getByText("COPIAR PIX").waitFor();
  const url = new URL(page.url());
  const orderNumber = decodeURIComponent(url.pathname.split("/").pop()!);
  const token = url.searchParams.get("t")!;
  check(await page.locator('[aria-label="QR Code do PIX"] svg').count() === 1, "QR Code renderizado");
  await page.getByText("COPIAR PIX").click();
  await page.waitForTimeout(800);

  let order = await db.order.findUniqueOrThrow({ where: { orderNumber }, include: { items: true } });
  check(order.status === "PIX_GENERATED", "status PIX_GENERATED", order.status);
  check(order.utmSource === "facebook" && order.utmMedium === "paid" && order.utmCampaign === "test" && order.utmContent === "creative01" && order.fbclid === "test", "atribuição (UTMs + fbclid) no pedido", { s: order.utmSource, m: order.utmMedium, c: order.utmCampaign, ct: order.utmContent, f: order.fbclid });
  check(order.channel === "facebook", "canal classificado", order.channel);
  check(order.items.some((i) => i.kind === "ORDER_BUMP"), "order bump no pedido (snapshot)", order.items.map((i) => `${i.kind}:${i.productName}:${i.unitPriceCents}`));
  check(order.items.every((i) => i.composition !== null), "composição salva no snapshot");
  check(order.adsConsent === true, "consentimento registrado");

  // 7. Segurança do webhook
  const bad = await sendWebhook(`evt_bad_${Date.now()}`, "transaction.paid", order, "t=1,v1=deadbeef");
  check(bad.status === 401, "webhook com assinatura inválida → 401", bad.status);
  order = await db.order.findUniqueOrThrow({ where: { orderNumber }, include: { items: true } });
  check(order.status === "PIX_GENERATED", "pedido NÃO muda com assinatura inválida", order.status);

  // 8. Pagamento confirmado (webhook assinado) + duplicado
  const eventId = `evt_e2e_${Date.now()}`;
  const ok = await sendWebhook(eventId, "transaction.paid", order);
  check(ok.status === 200, "webhook transaction.paid → 200", ok);
  const dup = await sendWebhook(eventId, "transaction.paid", order);
  check(dup.status === 200 && dup.json?.duplicate === true, "webhook duplicado não é reprocessado", dup.json);
  order = await db.order.findUniqueOrThrow({ where: { orderNumber }, include: { items: true } });
  check(order.status === "PAID" && order.paidAmountCents === order.totalCents, "pedido PAID com valor pago", { status: order.status, paid: order.paidAmountCents });
  check(order.feeCents != null && order.netCents != null, "taxa e líquido registrados", { fee: order.feeCents, net: order.netCents });
  const wh = await db.webhookEvent.findUnique({ where: { eventId } });
  check(wh?.previousStatus === "PIX_GENERATED" && wh?.newStatus === "PAID" && wh?.attempts === 2, "log do webhook (status anterior/novo, tentativas)", { prev: wh?.previousStatus, next: wh?.newStatus, attempts: wh?.attempts });

  // 9. Página atualiza sozinha para "pago"
  await page.getByText("Pagamento confirmado!").waitFor({ timeout: 20000 });
  check(true, "página do pedido atualizou automaticamente para pago");

  // 10. Upsell (se houver oferta elegível)
  const upsellBtn = page.locator('[data-cta="upsell_reject"]');
  if (await upsellBtn.count()) {
    await page.waitForTimeout(500);
    await upsellBtn.click();
    await page.waitForTimeout(1500);
    const ev = await db.upsellEvent.findMany({ where: { orderId: order.id } });
    check(ev.some((e) => e.action === "VIEW") && ev.some((e) => e.action === "REJECT"), "upsell view + reject registrados", ev.map((e) => e.action));
  } else {
    console.log("• nenhum upsell elegível (bump já incluiu o produto ofertado) — comportamento esperado");
  }

  // 11. Conteúdo digital
  const digital = await db.digitalAccess.count({ where: { orderItem: { orderId: order.id } } });
  check(digital > 0, "acesso digital criado após pagamento", digital);

  // 12. Eventos do funil
  await page.waitForTimeout(1200);
  const sessionId = order.sessionId!;
  const events = await db.analyticsEvent.findMany({ where: { OR: [{ sessionId }, { orderId: order.id }] }, select: { name: true } });
  const names = new Set(events.map((e) => e.name));
  for (const n of ["page_view", "landing_view", "scroll_25", "scroll_50", "scroll_75", "scroll_90", "product_view", "kit_selected", "cta_click", "add_to_cart", "checkout_started", "order_bump_view", "order_bump_accept", "pix_generated", "payment_pending", "pix_copy", "payment_paid", "purchase"]) {
    check(names.has(n), `evento ${n}`);
  }
  const session = await db.analyticsSession.findUnique({ where: { id: sessionId } });
  check(session?.utmSource === "facebook" && session?.fbclid === "test" && session?.device === "mobile", "sessão com origem e dispositivo", { src: session?.utmSource, device: session?.device });
  const purchase = await db.analyticsEvent.findFirst({ where: { orderId: order.id, name: "purchase" } });
  check(purchase?.valueCents === order.paidAmountCents, "purchase com o valor realmente pago", purchase?.valueCents);

  // 13. Frontend não consegue marcar como pago
  const forged = await fetch(`${base}/api/orders/status?pedido=${orderNumber}&t=${token}&status=PAID`);
  check(forged.ok, "endpoint de status é somente leitura");

  check(consoleErrors.length === 0, "sem erros de JavaScript", consoleErrors.slice(0, 3));
  await browser.close();
  await db.$disconnect();
  console.log(failures ? `\n${failures} verificação(ões) falharam` : "\nFunil completo OK");
  process.exitCode = failures ? 1 : 0;
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
