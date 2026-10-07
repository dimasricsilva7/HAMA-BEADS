import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentAssignments, getPublicCatalog } from "@/server/catalog";
import { getApprovedReviews, getFaqs, getGallery, getLandingSections } from "@/server/landing";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

/** Diagnóstico (somente admin): executa cada carregador da página inicial e devolve erros + dados brutos. */
export async function GET() {
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const run = async (name: string, fn: () => Promise<unknown>) => {
    const t = Date.now();
    try {
      const v = await fn();
      return { name, ok: true, ms: Date.now() - t, size: JSON.stringify(v ?? null).length };
    } catch (e) {
      return { name, ok: false, ms: Date.now() - t, error: e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 1500) : String(e) };
    }
  };
  const checks = [
    await run("assignments", () => currentAssignments()),
    await run("catalog", async () => getPublicCatalog(await currentAssignments())),
    await run("sections", () => getLandingSections()),
    await run("gallery", () => getGallery()),
    await run("faqs", () => getFaqs()),
    await run("reviews", () => getApprovedReviews()),
    await run("settings", () => getSettings()),
  ];
  const raw = {
    sections: await db.landingSection.findMany({ orderBy: { sortOrder: "asc" } }).catch((e) => String(e)),
    reviews: await db.review.findMany().catch((e) => String(e)),
    gallery: await db.galleryItem.findMany().catch((e) => String(e)),
    experiments: await db.experiment.findMany().catch((e) => String(e)),
  };
  return NextResponse.json({ checks, raw }, { headers: { "Cache-Control": "no-store" } });
}
