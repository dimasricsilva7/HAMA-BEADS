import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";
import { getSettingsFresh, isOn } from "@/server/settings";
import { crediarioConfig } from "@/lib/crediario";
import { bravopayMode } from "@/lib/env";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const s = await getSettingsFresh();
  return (
    <CheckoutClient
      requireCpf={isOn(s.require_cpf)}
      checkoutNote={s.checkout_note || null}
      shippingNote={s.shipping_note || null}
      consentLabel={s.marketing_consent_label}
      pix={{
        enabled: isOn(s.pix_enabled) && bravopayMode() !== "disabled",
        label: s.pix_method_label || "PIX",
        badge: s.pix_badge ?? "",
        description: s.pix_description ?? "",
        button: s.pix_button_label || "Gerar PIX",
      }}
      crediario={crediarioConfig(s)}
    />
  );
}
