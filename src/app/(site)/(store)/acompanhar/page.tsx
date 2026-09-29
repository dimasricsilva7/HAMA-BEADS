import type { Metadata } from "next";
import { LookupForm } from "./LookupForm";

export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false } };

export default function TrackOrderPage() {
  return (
    <div className="container-page max-w-lg py-12 sm:py-16">
      <h1 className="h-section">Acompanhar pedido</h1>
      <p className="lead mt-3">Informe o número do pedido e o e-mail usado na compra.</p>
      <LookupForm />
    </div>
  );
}
