import { PageHeader } from "@/components/admin/ui";
import { AoVivoClient } from "./AoVivoClient";

export const metadata = { title: "Clientes online" };

export default function OnlinePage() {
  return <div><PageHeader title="Clientes online" description="Acompanhe visitantes, página atual, origem, campanha e dispositivo. Atualização automática a cada 5 segundos."/><AoVivoClient/></div>;
}
