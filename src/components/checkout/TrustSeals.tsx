import { CheckoutIcon, type CheckoutIconName } from "@/components/checkout/CheckoutIcon";

/** Selos de confiança do checkout: compra segura, dados protegidos, entrega e pagamento. */
export function TrustSeals({ freeShipping, cnpj, companyName }: { freeShipping: boolean; cnpj: string | null; companyName: string | null }) {
  const seals: { icon: CheckoutIconName; title: string; sub: string }[] = [
    { icon: "shield-check", title: "Compra segura", sub: "Ambiente protegido" },
    { icon: "lock", title: "Dados protegidos", sub: "Uso restrito ao pedido" },
    { icon: "truck", title: freeShipping ? "Frete grátis" : "Entrega", sub: freeShipping ? "Condição aplicada ao pedido" : "Prazo calculado no checkout" },
  ];
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <ul className="grid grid-cols-3 gap-2 text-center">
        {seals.map((s) => (
          <li key={s.title} className="flex flex-col items-center gap-1 px-1">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-success/10 text-success">
              <CheckoutIcon name={s.icon} className="h-5 w-5" />
            </span>
            <span className="text-[12px] font-extrabold leading-tight text-ink">{s.title}</span>
            <span className="hidden text-[11px] leading-tight text-muted sm:block">{s.sub}</span>
          </li>
        ))}
      </ul>
      {(companyName || cnpj) && (
        <p className="mt-2 border-t border-line pt-2 text-center text-[11px] leading-tight text-muted">
          Vendido e entregue por {companyName || "nossa loja"}{cnpj ? ` · CNPJ ${cnpj}` : ""}
        </p>
      )}
    </div>
  );
}
