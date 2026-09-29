import { NextResponse, after, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { ensurePix, findOrderByAccess, syncOrder, toPublicOrder } from "@/server/orders";
import { maybeReconcileOpportunistically } from "@/server/jobs";

export const dynamic = "force-dynamic";

/**
 * Polling da página do pedido. `force=1` ("Já paguei") apenas antecipa a consulta
 * ao gateway — o navegador nunca consegue marcar um pedido como pago.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`status:${ip}`, 40, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const sp = req.nextUrl.searchParams;
  let order = await findOrderByAccess(sp.get("pedido"), sp.get("t"));
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (order.status === "PENDING" || order.status === "PIX_GENERATED") {
    if (!order.pixCopyPaste && sp.get("retry") === "1") await ensurePix(order.id).catch(() => null);
    else await syncOrder(order, { minIntervalMs: sp.get("force") === "1" ? 3000 : 8000, source: "poll" });
    order = (await findOrderByAccess(sp.get("pedido"), sp.get("t")))!;
  }
  after(() => maybeReconcileOpportunistically());
  return NextResponse.json(toPublicOrder(order), { headers: { "Cache-Control": "no-store" } });
}
