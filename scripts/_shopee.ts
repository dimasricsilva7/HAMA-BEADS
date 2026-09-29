import { chromium } from "playwright";
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ locale: "pt-BR", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const api: string[] = [];
  p.on("response", async (r) => { if (/api\/v4\/(pdp|item)/.test(r.url())) { try { api.push(r.url() + "\n" + (await r.text()).slice(0, 20000)); } catch {} } });
  await p.goto(process.argv[2], { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(9000);
  console.log("URL:", p.url());
  console.log("TITLE:", await p.title());
  console.log((await p.locator("body").innerText()).slice(0, 6000));
  console.log("API:", api.length, api.join("\n---\n").slice(0, 8000));
  await p.screenshot({ path: process.argv[3], fullPage: false });
  await b.close();
})();
