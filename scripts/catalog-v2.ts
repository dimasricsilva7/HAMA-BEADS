/** Aplica o catálogo v2 no banco do .env (ou DATABASE_URL). Em produção use /api/cron/catalog-v2. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { applyCatalogV2 } from "../src/server/data/catalog-v2";

const db = new PrismaClient();
applyCatalogV2(db)
  .then((r) => console.log(r.log.length ? r.log.join("\n") : "nada a aplicar"))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
