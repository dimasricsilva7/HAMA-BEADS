import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { consumeDigitalAccess } from "@/server/orders";

export const dynamic = "force-dynamic";

/** Acesso seguro ao conteúdo digital: valida o token, registra o download e redireciona. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`dl:${ip}`, 30, 10 * 60_000)) return new NextResponse("Muitas tentativas. Aguarde alguns minutos.", { status: 429 });
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return new NextResponse("Link inválido.", { status: 404 });

  const result = await consumeDigitalAccess(token);
  if (!result.ok) {
    return new NextResponse(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Conteúdo digital</title><body style="font-family:system-ui;padding:32px;max-width:520px;margin:auto"><h1 style="font-size:20px">Conteúdo digital</h1><p>${result.reason}</p><p><a href="/">Voltar à loja</a></p></body>`, {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return NextResponse.redirect(result.url, { status: 302, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
