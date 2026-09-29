import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { safeEqual } from "@/lib/crypto";
import { db } from "@/lib/db";
import { log } from "@/lib/log";
import { runAllJobs, runCleanupJobs, runReconcileJobs } from "@/server/jobs";
import { migrateFromLegacy, resetAdminFromEnv } from "@/server/maintenance";
import { applyCatalogV2 } from "@/server/data/catalog-v2";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function refreshAll() {
  for (const t of ["catalog", "settings", "landing", "gallery", "faq", "reviews", "experiments"]) revalidateTag(t);
  revalidatePath("/", "layout");
}

/**
 * Jobs protegidos por CRON_SECRET (Authorization: Bearer ...).
 *   Rotina (Vercel Cron + GitHub Actions): /api/cron/all · reconcile · cleanup
 *   Manutenção (manual):
 *     /api/cron/migrate-legacy[?force=1] — copia os dados de LEGACY_DATABASE_URL para o banco atual
 *     /api/cron/reset-admin             — senha de ADMIN_EMAIL = ADMIN_PASSWORD_HASH
 *     /api/cron/catalog-v2              — aplica a atualização de catálogo v2
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { job } = await params;
  const force = req.nextUrl.searchParams.get("force") === "1";
  const runners: Record<string, () => Promise<unknown>> = {
    all: runAllJobs,
    reconcile: runReconcileJobs,
    cleanup: runCleanupJobs,
    "migrate-legacy": async () => {
      const r = await migrateFromLegacy(db, process.env.LEGACY_DATABASE_URL, force);
      refreshAll();
      return r;
    },
    "reset-admin": () => resetAdminFromEnv(db),
    "catalog-v2": async () => {
      const r = await applyCatalogV2(db);
      refreshAll();
      return r;
    },
  };
  const run = runners[job];
  if (!run) return NextResponse.json({ error: "unknown_job" }, { status: 404 });
  try {
    const result = await run();
    log.info("cron", "job executado", { job });
    return NextResponse.json({ ok: true, job, result });
  } catch (err) {
    log.error("cron", "job falhou", { job, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ ok: false, error: "job_failed", message: err instanceof Error ? err.message.slice(0, 300) : "erro" }, { status: 500 });
  }
}
