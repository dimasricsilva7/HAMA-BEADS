import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const protocolDefaults: Record<string, string> = {
  crediario_method_label: "Crediário",
  crediario_method_subtitle: "Em até {parcelas}x · com seu protocolo",
  crediario_section_title: "Pagar com crediário",
  crediario_description: "Informe o número do protocolo, a validade e os 3 últimos dígitos do CPF vinculado. A equipe da loja confere as informações antes de confirmar o pedido.",
  crediario_protocol_label: "Número do protocolo",
  crediario_protocol_placeholder: "Digite os 16 dígitos do protocolo",
  crediario_protocol_digits: "16",
  crediario_protocol_help: "",
  crediario_protocol_error: "Informe os {n} dígitos do protocolo (somente números).",
  crediario_validity_label: "Validade do protocolo",
  crediario_validity_placeholder: "MM/AA",
  crediario_validity_format: "MM/AA",
  crediario_validity_error: "Informe a validade no formato {formato}.",
  crediario_validity_expired_error: "Este protocolo está vencido. Confira a validade.",
  crediario_validity_reject_expired: "true",
  crediario_cpf_label: "3 últimos dígitos do CPF",
  crediario_cpf_placeholder: "Digite os 3 últimos dígitos",
  crediario_cpf_digits: "3",
  crediario_cpf_error: "Informe os {n} últimos dígitos do CPF.",
  crediario_installments_label: "Parcelamento",
  crediario_installments_description: "",
  crediario_max_installments: "2",
  crediario_installment_text: "{n}x de {valor}",
  crediario_help_text: "",
  crediario_error_message: "Não foi possível registrar seu pedido no crediário. Confira os dados e tente novamente.",
  crediario_success_title: "Solicitação recebida",
  crediario_success_message: "Recebemos seu pedido pelo crediário. A equipe verificará o protocolo e entrará em contato pelos dados informados.",
  crediario_info_message: "Nenhum valor é cobrado agora. O pedido fica aguardando a conferência do protocolo pela equipe da loja.",
  crediario_button_label: "Enviar pedido para análise",
  crediario_security_text: "As informações do protocolo são armazenadas criptografadas e usadas somente para validar sua solicitação.",
};

/**
 * Mantém PIX e crediário ativos. O formulário baseado em protocolo é configurado
 * apenas uma vez, para corrigir os antigos textos de cartão sem sobrescrever
 * futuras edições do administrador a cada build.
 */
async function main() {
  for (const key of ["pix_enabled", "crediario_enabled"]) {
    await db.setting.upsert({
      where: { key },
      update: { value: "true", updatedBy: "system:payment-methods-enable" },
      create: { key, value: "true", updatedBy: "system:payment-methods-enable" },
    });
  }

  const markerKey = "footwear_crediario_protocol_setup_v1";
  const marker = await db.setting.findUnique({ where: { key: markerKey } });
  if (!marker) {
    for (const [key, value] of Object.entries(protocolDefaults)) {
      await db.setting.upsert({
        where: { key },
        update: { value, updatedBy: "system:crediario-protocol-setup" },
        create: { key, value, updatedBy: "system:crediario-protocol-setup" },
      });
    }
    await db.setting.upsert({
      where: { key: markerKey },
      update: { value: "true", updatedBy: "system:crediario-protocol-setup" },
      create: { key: markerKey, value: "true", updatedBy: "system:crediario-protocol-setup" },
    });
  }

  console.info("FOOTWEAR_PAYMENT_METHODS_ENABLED " + JSON.stringify({
    pix: true,
    crediario: true,
    protocolConfigurationApplied: !marker,
    maxInstallments: protocolDefaults.crediario_max_installments,
    protocolDigits: protocolDefaults.crediario_protocol_digits,
    cpfDigits: protocolDefaults.crediario_cpf_digits,
  }));
}

main()
  .catch((error) => {
    console.error("FOOTWEAR_PAYMENT_SETUP_FAILED", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
