/**
 * Teste do admin: login (bootstrap via ADMIN_EMAIL/ADMIN_PASSWORD_HASH), todas as
 * páginas carregam sem erro, alteração de preço → auditoria + histórico + loja e
 * checkout atualizados, e bloqueio de acesso sem sessão.
 *   ADMIN_PASSWORD=... npx tsx scripts/e2e-admin.ts [baseUrl]
 */
import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const base = process.argv[2] ?? "http://localhost:3000";
const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD ?? (existsSync(".admin-dev-password") ? readFileSync(".admin-dev-password", "utf8").trim() : "");
const db = new PrismaClient();
let failures = 0;
const check = (ok: boolean, label: string, extra?: unknown) => {
  console.log(`${ok ? "✔" : "✘"} ${label}${extra !== undefined ? ` → ${JSON.stringify(extra)}` : ""}`);
  if (!ok) failures++;
};

const PAGES = [
  "/admin", "/admin/funil", "/admin/pix-pendentes", "/admin/pedidos", "/admin/clientes", "/admin/cupons", "/admin/produtos", "/admin/produtos/novo",
  "/admin/order-bumps", "/admin/upsells", "/admin/experimentos", "/admin/aquisicao", "/admin/aquisicao?por=utmCampaign", "/admin/custos", "/admin/cliques",
  "/admin/relatorio-produtos", "/admin/relatorio-ofertas", "/admin/landing", "/admin/landing/hero", "/admin/landing/how_it_works", "/admin/landing/audience_kids",
  "/admin/galeria", "/admin/faq", "/admin/avaliacoes", "/admin/configuracoes", "/admin/configuracoes?aba=aparencia", "/admin/configuracoes?aba=checkout",
  "/admin/configuracoes?aba=rastreamento", "/admin/configuracoes?aba=seo", "/admin/configuracoes?aba=politicas", "/admin/configuracoes?aba=mensagens",
  "/admin/configuracoes?aba=sistema", "/admin/webhooks", "/admin/auditoria", "/admin/usuarios", "/admin?periodo=30d", "/admin?periodo=month",
];

(async () => {
  // Sem sessão → redireciona / 401
  const noAuth = await fetch(`${base}/admin/pedidos`, { redirect: "manual" });
  check(noAuth.status === 307 || noAuth.status === 308, "sem sessão: /admin redireciona para login", noAuth.status);
  const api = await fetch(`${base}/api/admin/upload`, { method: "POST" });
  check(api.status === 401, "sem sessão: /api/admin → 401", api.status);

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(`${base}/admin/login`);
  await page.fill("#email", email);
  await page.fill("#password", "senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("E-mail ou senha inválidos.").waitFor();
  check(true, "login com senha errada é recusado");
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${base}/admin`);
  check(true, "login do admin (bootstrap por variável de ambiente)");

  for (const p of PAGES) {
    const res = await page.goto(base + p, { waitUntil: "domcontentloaded" });
    const hasError = await page.getByText("Algo não saiu como esperado").count();
    check(res?.status() === 200 && !hasError, `página ${p}`, res?.status());
  }

  // Alteração de preço
  const kit = await db.product.findUniqueOrThrow({ where: { slug: "kit-24-cores" } });
  const original = kit.priceCents;
  await page.goto(`${base}/admin/produtos/${kit.id}`);
  await page.fill('input[name="price"]', "54,90");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.getByText(/Preço do Kit Inicial 24 Cores alterado de R\$\s39,99 para R\$\s54,90/).waitFor({ timeout: 15000 });
  const audit = await db.auditLog.findFirst({ where: { entityId: kit.id, action: "product_updated" }, orderBy: { createdAt: "desc" } });
  check(Boolean(audit?.summary?.includes("54,90")) && (audit?.before as { priceCents?: number })?.priceCents === original, "auditoria com valor anterior e novo", audit?.summary);
  const hist = await db.priceHistory.findFirst({ where: { productId: kit.id }, orderBy: { createdAt: "desc" } });
  check(hist?.oldPriceCents === original && hist?.newPriceCents === 5490, "histórico de preço registrado");
  const landing = await (await fetch(`${base}/`)).text();
  check(landing.includes("54,90"), "landing exibe o novo preço imediatamente");
  const quote = await fetch(`${base}/api/cart/quote`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ items: [{ productId: kit.id, quantity: 1 }] }) }).then((r) => r.json());
  check(quote.totalCents === 5490, "checkout usa o novo preço", quote.totalCents);

  // Reverte
  await page.goto(`${base}/admin/produtos/${kit.id}`);
  await page.fill('input[name="price"]', (original / 100).toFixed(2).replace(".", ","));
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.getByText(/alterado de R\$\s54,90/).waitFor({ timeout: 15000 });
  check(true, "preço revertido");

  // Produto sem preço não pode ser ativado
  const peg = await db.product.findUniqueOrThrow({ where: { slug: "pinca" } });
  await page.goto(`${base}/admin/produtos/${peg.id}`);
  await page.check('input[name="active"]');
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.getByText("Defina um preço maior que zero para ativar o produto.").waitFor({ timeout: 15000 });
  check(true, "produto sem preço não é ativado");

  check(errors.length === 0, "sem erros de JavaScript no admin", errors.slice(0, 3));
  await browser.close();
  await db.$disconnect();
  console.log(failures ? `\n${failures} verificação(ões) falharam` : "\nAdmin OK");
  process.exitCode = failures ? 1 : 0;
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
