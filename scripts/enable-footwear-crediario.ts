import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const values: Record<string, string> = {
    store_name: "Crocs Shop Independente",
    store_tagline: "Revenda independente de produtos da marca Crocs.",
    announcement_text: "Loja independente — produtos da marca Crocs vendidos por revendedor independente.",
    seo_title: "Crocs Shop Independente — Calçados e Jibbitz",
    seo_description: "Explore modelos, cores e tamanhos da marca Crocs em uma loja independente. Consulte disponibilidade, condições de venda e atendimento.",
    crediario_enabled: "true",
    crediario_method_label: "Crediário",
    crediario_method_subtitle: "Em até {parcelas}x · com seu protocolo",
    crediario_section_title: "Pagar com crediário",
    crediario_description: "Informe o número do protocolo, a validade e os 3 últimos dígitos do CPF vinculado. A equipe da loja confere as informações antes de confirmar o pedido.",
    crediario_protocol_label: "Número do protocolo",
    crediario_protocol_placeholder: "Digite os 16 dígitos do protocolo",
    crediario_protocol_digits: "16",
    crediario_validity_label: "Validade do protocolo",
    crediario_validity_placeholder: "MM/AA",
    crediario_validity_format: "MM/AA",
    crediario_cpf_label: "3 últimos dígitos do CPF",
    crediario_cpf_placeholder: "Digite os 3 últimos dígitos",
    crediario_cpf_digits: "3",
    crediario_max_installments: "2",
    crediario_info_message: "Nenhum valor é cobrado agora. O pedido fica aguardando a conferência do protocolo pela equipe da loja.",
    crediario_success_title: "Solicitação recebida",
    crediario_success_message: "Recebemos seu pedido pelo crediário. A equipe verificará o protocolo e entrará em contato pelos dados informados.",
    crediario_button_label: "Enviar pedido para análise",
    crediario_security_text: "As informações do protocolo são armazenadas criptografadas e usadas somente para validar sua solicitação.",
  };
  for (const [key, value] of Object.entries(values)) {
    await db.setting.upsert({
      where: { key },
      update: { value, updatedBy: "system:storefront-setup" },
      create: { key, value, updatedBy: "system:storefront-setup" },
    });
  }
  console.info("FOOTWEAR_CREDIARIO_ENABLED " + JSON.stringify({ enabled: true, settings: Object.keys(values).length }));
}

main().catch((error) => {
  console.error("FOOTWEAR_CREDIARIO_SETUP_FAILED", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
