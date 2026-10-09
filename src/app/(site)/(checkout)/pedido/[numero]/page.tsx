import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { OrderClient } from "./OrderClient";
import { findOrderByAccess, getNextUpsell, toPublicOrder } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { crediarioConfig } from "@/lib/crediario";
import { whatsappLink } from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ numero: string }>; searchParams: Promise<{ t?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ numero }, { t }] = await Promise.all([params, searchParams]);
  const order = await findOrderByAccess(decodeURIComponent(numero), t);
  if (!order) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <h1 className="h-section">Pedido não encontrado</h1>
        <p className="lead mt-3">Confira o link recebido ou busque pelo número do pedido e e-mail.</p>
        <Link href="/acompanhar" className="btn-primary mt-8">Acompanhar pedido</Link>
      </div>
    );
  }
  const [pub, upsell, s] = await Promise.all([Promise.resolve(toPublicOrder(order)), getNextUpsell(order), getSettings()]);
  const qrSvg = pub.pixCopyPaste ? await QRCode.toString(pub.pixCopyPaste, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#17142E", light: "#FFFFFF" } }) : null;
  const wa = s.whatsapp ? whatsappLink(s.whatsapp, `Olá! Tenho uma dúvida sobre o pedido ${pub.orderNumber}.`) : null;
  const cfg = crediarioConfig(s);

  return <OrderClient initial={pub} token={t!} qrSvg={qrSvg} upsell={upsell} whatsappUrl={wa} storeName={s.store_name} crediarioTexts={{ successTitle: cfg.successTitle, successMessage: cfg.successMessage, infoMessage: cfg.infoMessage }} />;
}
