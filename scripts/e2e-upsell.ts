/**
 * Upsell pós-compra: compra sem bump → pagamento → upsell exibido → aceite gera
 * pedido complementar com novo PIX → pagamento → volta ao pedido principal sem
 * repetir a oferta. Requer BRAVOPAY_MODE=mock e um upsell ativo elegível.
 *   npx tsx scripts/e2e-upsell.ts [baseUrl]
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

async function pay(orderNumber: string) {
  const o = await db.order.findUniqueOrThrow({ where: { orderNumber } });
  const body = JSON.stringify({ id: `evt_up_${o.id}_${Date.now()}`, type: "transaction.paid", created: Math.floor(Date.now() / 1000), data: { id: o.transactionId, status: "PAID", amount_cents: o.totalCents, external_reference: o.externalReference, paid_at: new Date().toISOString() } });
  const ts = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  const res = await fetch(`${base}/api/webhooks/bravopay`, { method: "POST", headers: { "Content-Type": "application/json", "X-Bravopay-Signature": `t=${ts},v1=${sig}` }, body });
  return res.status;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36" });
  const page = await ctx.newPage();
  const kit = await db.product.findUniqueOrThrow({ where: { slug: "kit-inicial" } });
  await page.goto(`${base}/?utm_source=tiktok&utm_campaign=upsell-test&ttclid=tt123`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate((id) => localStorage.setItem("hb_cart", JSON.stringify({ items: [{ productId: id, quantity: 1 }], bumpIds: [], couponCode: null })), kit.id);
  await page.goto(`${base}/checkout`, { waitUntil: "networkidle" });
  await page.fill("#name", "Upsell Teste");
  await page.fill("#phone", "21987654321");
  await page.fill("#email", `upsell+${Date.now()}@example.com`);
  if (await page.locator("#cpf").count()) await page.fill("#cpf", "52998224725");
  await page.fill("#cep", "20040002");
  await page.waitForTimeout(1500);
  for (const [sel, v] of [["#street", "Rua Teste"], ["#district", "Centro"], ["#city", "Rio de Janeiro"]] as const) if (!(await page.inputValue(sel))) await page.fill(sel, v);
  await page.fill("#number", "10");
  if (!(await page.inputValue("#state"))) await page.selectOption("#state", "RJ");
  await page.locator('button[data-cta="checkout_submit"]:visible').click();
  await page.waitForURL(/\/pedido\//, { timeout: 30000 });
  const parentNumber = decodeURIComponent(new URL(page.url()).pathname.split("/").pop()!);
  check((await pay(parentNumber)) === 200, "pedido principal pago via webhook");
  await page.getByText("Pagamento confirmado!").waitFor({ timeout: 20000 });

  const accept = page.locator('[data-cta="upsell_accept"]');
  await accept.waitFor({ timeout: 10000 });
  check(true, "upsell exibido após pagamento");
  await page.waitForTimeout(800);
  await accept.click();
  await page.waitForURL((u) => !u.pathname.endsWith(parentNumber), { timeout: 30000 });
  await page.getByText("COPIAR PIX").waitFor();
  const childNumber = decodeURIComponent(new URL(page.url()).pathname.split("/").pop()!);
  const child = await db.order.findUniqueOrThrow({ where: { orderNumber: childNumber }, include: { items: true, parentOrder: true } });
  check(child.source === "UPSELL" && child.parentOrder?.orderNumber === parentNumber, "pedido complementar vinculado ao principal");
  check(child.utmSource === "tiktok" && child.ttclid === "tt123", "atribuição herdada do pedido principal");
  check(child.items[0]?.kind === "UPSELL", "item do tipo UPSELL", child.items.map((i) => i.productName));

  check((await pay(childNumber)) === 200, "upsell pago via webhook");
  await page.getByText("Voltar ao pedido principal").click({ timeout: 20000 });
  await page.waitForURL((u) => u.pathname.endsWith(parentNumber));
  await page.waitForTimeout(1000);
  const parent = await db.order.findUniqueOrThrow({ where: { orderNumber: parentNumber } });
  const events = await db.upsellEvent.findMany({ where: { orderId: parent.id } });
  check(events.some((e) => e.action === "VIEW") && events.some((e) => e.action === "ACCEPT" && e.childOrderId === child.id), "eventos VIEW e ACCEPT registrados", events.map((e) => e.action));
  const acceptedUpsell = events.find((e) => e.action === "ACCEPT")!.upsellId;
  const shownAgain = await page.locator('[data-cta="upsell_accept"]').count();
  if (shownAgain) {
    const title = await page.locator("#upsell-title").textContent();
    const u = await db.upsell.findUniqueOrThrow({ where: { id: acceptedUpsell } });
    check(title !== u.title, "não repete o upsell já aceito (mostra o próximo da sequência)", title);
  } else check(true, "não repete o upsell já aceito");
  const digital = await db.digitalAccess.count({ where: { orderItem: { orderId: child.id } } });
  check(digital > 0, "conteúdo digital do upsell liberado");

  await browser.close();
  await db.$disconnect();
  console.log(failures ? `\n${failures} falha(s)` : "\nUpsell OK");
  process.exitCode = failures ? 1 : 0;
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
