import Link from "next/link";
import { PageHeader, btnSecondary } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSettingsFresh } from "@/server/settings";
import { CrediarioEditor } from "./CrediarioEditor";

export const metadata = { title: "Crediário" };

export default async function CrediarioSettingsPage() {
  const [s, kit] = await Promise.all([
    getSettingsFresh(),
    db.product.findFirst({ where: { category: "KIT", active: true }, orderBy: { priceCents: "desc" }, select: { priceCents: true } }),
  ]);
  const sample = kit?.priceCents ?? 11990;
  return (
    <div>
      <PageHeader
        title="Pagamentos → Crediário"
        description="Método próprio baseado em protocolo (não é cartão). Todos os títulos, placeholders, dígitos, formato da validade, parcelas e mensagens são editáveis aqui."
        actions={
          <>
            <Link href="/admin/pagamentos" className={btnSecondary}>PIX</Link>
            <Link href="/admin/pedidos?metodo=CREDIARIO" className={btnSecondary}>Pedidos no crediário</Link>
          </>
        }
      />
      <CrediarioEditor initial={s} sampleTotalCents={sample} />
    </div>
  );
}
