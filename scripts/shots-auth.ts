/** Screenshots de páginas do admin e do checkout (uso local). npx tsx scripts/shots-auth.ts base outDir */
import "dotenv/config";
import { readFileSync } from "fs";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
const [base, out] = process.argv.slice(2);
(async () => {
  const db = new PrismaClient();
  const b = await chromium.launch();
  const desk = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await desk.goto(`${base}/admin/login`);
  await desk.fill("#email", process.env.ADMIN_EMAIL!);
  await desk.fill("#password", readFileSync(".admin-dev-password", "utf8").trim());
  await desk.getByRole("button", { name: "Entrar" }).click();
  await desk.waitForURL(`${base}/admin`);
  const order = await db.order.findFirst({ where: { status: "PAID" }, orderBy: { createdAt: "desc" } });
  for (const [name, path] of [["admin-dash", "/admin?periodo=30d"], ["admin-order", `/admin/pedidos/${order?.id}`], ["admin-product", "/admin/produtos"], ["admin-funnel", "/admin/funil?periodo=30d"]]) {
    await desk.goto(base + path, { waitUntil: "networkidle" });
    await desk.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  }
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  await m.context().addCookies([{ name: "hb_consent", value: "denied", url: base }]);
  const kit = await db.product.findUniqueOrThrow({ where: { slug: "kit-48-cores" } });
  await m.goto(base + "/");
  await m.evaluate((id) => localStorage.setItem("hb_cart", JSON.stringify({ items: [{ productId: id, quantity: 1 }], bumpIds: [], couponCode: null })), kit.id);
  await m.goto(base + "/checkout", { waitUntil: "networkidle" });
  await m.waitForTimeout(800);
  await m.screenshot({ path: `${out}/m-checkout.png`, fullPage: true });
  const pend = await db.order.findFirst({ where: { status: "PIX_GENERATED" }, orderBy: { createdAt: "desc" } });
  if (pend) {
    await m.goto(`${base}/pedido/${pend.orderNumber}?t=${pend.accessToken}`, { waitUntil: "networkidle" });
    await m.screenshot({ path: `${out}/m-pix.png`, fullPage: true });
  }
  if (order) {
    await m.goto(`${base}/pedido/${order.orderNumber}?t=${order.accessToken}`, { waitUntil: "networkidle" });
    await m.screenshot({ path: `${out}/m-paid.png`, fullPage: true });
  }
  await b.close();
  await db.$disconnect();
})();
