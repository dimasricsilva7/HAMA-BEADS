import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/log";
import { reconcilePendingOrders } from "@/server/orders";
import { retryFailedWebhooks } from "@/server/webhooks";

/** Trava distribuída simples via banco — evita dois processadores simultâneos. */
async function withLock<T>(name: string, ttlMs: number, fn: () => Promise<T>): Promise<T | { skipped: true }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  const taken = await db.$executeRaw`
    INSERT INTO "JobLock" ("name", "lockedAt", "expiresAt") VALUES (${name}, ${now}, ${expiresAt})
    ON CONFLICT ("name") DO UPDATE SET "lockedAt" = EXCLUDED."lockedAt", "expiresAt" = EXCLUDED."expiresAt"
    WHERE "JobLock"."expiresAt" < ${now}`;
  if (taken === 0) return { skipped: true };
  try {
    return await fn();
  } finally {
    await db.jobLock.delete({ where: { name } }).catch(() => {});
  }
}

/** Verifica PIX pendentes no gateway, expira os vencidos e reprocessa webhooks com falha. */
export async function runReconcileJobs() {
  return withLock("reconcile", 5 * 60_000, async () => ({
    reconcile: await reconcilePendingOrders(20),
    webhooks: await retryFailedWebhooks(10),
  }));
}

/** Limpeza: sessões admin expiradas, tentativas de login antigas, analytics com mais de 13 meses. */
export async function runCleanupJobs() {
  return withLock("cleanup", 10 * 60_000, async () => {
    const now = Date.now();
    const sessions = await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const attempts = await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now - 30 * 86_400_000) } } });
    const analytics = await db.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: new Date(now - 395 * 86_400_000) } } });
    return { adminSessions: sessions.count, loginAttempts: attempts.count, analyticsSessions: analytics.count };
  });
}

export async function runAllJobs() {
  const started = Date.now();
  const reconcile = await runReconcileJobs();
  const cleanup = await runCleanupJobs();
  const result = { ms: Date.now() - started, reconcile, cleanup };
  log.info("cron", "jobs executados", result);
  return result;
}

let lastOpportunistic = 0;
/** Reconciliação oportunista a partir do tráfego (via after()), no máximo 1x/min por instância. */
export async function maybeReconcileOpportunistically() {
  if (Date.now() - lastOpportunistic < 60_000) return;
  lastOpportunistic = Date.now();
  try {
    await runReconcileJobs();
  } catch (err) {
    log.error("cron", "reconciliação oportunista falhou", { error: err instanceof Error ? err.message : String(err) });
  }
}
