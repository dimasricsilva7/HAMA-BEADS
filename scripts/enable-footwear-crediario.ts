import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Mantém o método de crediário disponível no checkout.
 * Os campos, mensagens, formato de validade e parcelamento são editáveis
 * em Admin → Pagamentos → Crediário e NÃO devem ser redefinidos a cada build.
 */
async function main() {
  await db.setting.upsert({
    where: { key: "crediario_enabled" },
    update: { value: "true", updatedBy: "system:crediario-enable" },
    create: { key: "crediario_enabled", value: "true", updatedBy: "system:crediario-enable" },
  });
  console.info("FOOTWEAR_CREDIARIO_ENABLED " + JSON.stringify({ enabled: true }));
}

main()
  .catch((error) => {
    console.error("FOOTWEAR_CREDIARIO_SETUP_FAILED", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
