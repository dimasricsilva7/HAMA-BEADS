/** Captura quadros do tamanho da tela descendo a página: npx tsx scripts/frames.ts url outDir width [maxFrames] */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
const [url, out, w = "390", max = "40"] = process.argv.slice(2);
(async () => {
  mkdirSync(out, { recursive: true });
  const width = Number(w);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height: width < 800 ? 844 : 900 }, isMobile: width < 800, hasTouch: width < 800 });
  await ctx.addCookies([{ name: "hb_consent", value: "denied", url }]);
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  const h = await p.evaluate(() => document.body.scrollHeight);
  const vh = width < 800 ? 844 : 900;
  let i = 0;
  for (let y = 0; y < h && i < Number(max); y += vh, i++) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${width}-${String(i).padStart(2, "0")}.png` });
  }
  console.log(`${i} quadros, altura ${h}px`);
  await b.close();
})();
