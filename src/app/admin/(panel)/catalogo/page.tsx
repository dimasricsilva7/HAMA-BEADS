import { PageHeader } from "@/components/admin/ui";
import CatalogSyncClient from "./CatalogSyncClient";

export const metadata = { title: "Importar catálogo" };

export default function CatalogSyncPage() {
  return <div><PageHeader title="Importar catálogo" description="Sincronize produtos, fotos, preços e variantes das coleções ligadas à campanha." /><CatalogSyncClient /></div>;
}
