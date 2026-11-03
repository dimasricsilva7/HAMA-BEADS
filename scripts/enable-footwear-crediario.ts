import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Mantém o método de crediário disponível no checkout.
 * Os campos, mensagens, formato de validade e parcelamento são editáveis
 * em Admin → Pagamentos → Crediário e NÃO devem ser redefinidos a cada build.
 */
async function main() {
  for (const key of ["pix_enabled", "crediario_enabled"]) {
    await db.setting.upsert({
      where: { key },
      update: { value: "true", updatedBy: "system:payment-methods-enable" },
      create: { key, value: "true", updatedBy: "system:payment-methods-enable" },
    });
  }
  console.info("FOOTWEAR_PAYMENT_METHODS_ENABLED " + JSON.stringify({ pix: true, crediario: true }));
}

main()
  .catch((error) => {
    console.error("FOOTWEAR_CREDIARIO_SETUP_FAILED", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
