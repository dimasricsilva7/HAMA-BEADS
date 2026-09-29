import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";
import { getSettings, isOn } from "@/server/settings";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <CheckoutClient
      requireCpf={isOn(s.require_cpf)}
      checkoutNote={s.checkout_note || null}
      shippingNote={s.shipping_note || null}
      consentLabel={s.marketing_consent_label}
    />
  );
}
