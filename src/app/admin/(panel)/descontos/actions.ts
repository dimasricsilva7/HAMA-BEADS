"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { CATEGORY_LABEL } from "@/lib/domain";
import { withAdminVoid, refreshStore } from "@/server/admin/guard";
import { parseLocalDateTime } from "@/server/admin/forms";

export async function saveSectionDiscount(fd: FormData) {
  await withAdminVoid("ADMIN", async (admin) => {
    const category = String(fd.get("category") ?? "");
    if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABEL, category)) throw new Error("Selecione uma seção válida.");
    const percent = Number.parseInt(String(fd.get("percent") ?? ""), 10);
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new Error("Informe um desconto entre 0% e 100%.");
    const startsAt = parseLocalDateTime(fd.get("startsAt"));
    const endsAt = parseLocalDateTime(fd.get("endsAt"));
    if ((startsAt && !endsAt) || (!startsAt && endsAt) || (startsAt && endsAt && endsAt <= startsAt)) {
      throw new Error("Para programar a campanha, informe início e fim válidos.");
    }
    const before = await db.sectionDiscount.findUnique({ where: { category: category as keyof typeof CATEGORY_LABEL } });
    const after = await db.sectionDiscount.upsert({
      where: { category: category as keyof typeof CATEGORY_LABEL },
      update: { percent, active: percent > 0, startsAt, endsAt },
      create: { category: category as keyof typeof CATEGORY_LABEL, percent, active: percent > 0, startsAt, endsAt },
    });
    await audit(admin.id, "section_discount_updated", "section_discount", category, {
      summary: percent > 0 ? `Desconto de ${percent}% configurado para ${CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}` : `Desconto removido de ${CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}`,
      before: before as unknown as Record<string, unknown> ?? undefined,
      after: after as unknown as Record<string, unknown>,
    });
  });
  refreshStore("catalog", "landing");
  revalidatePath("/admin/descontos");
}

export async function removeSectionDiscount(fd: FormData) {
  await withAdminVoid("ADMIN", async (admin) => {
    const category = String(fd.get("category") ?? "");
    if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABEL, category)) throw new Error("Seção inválida.");
    const before = await db.sectionDiscount.findUnique({ where: { category: category as keyof typeof CATEGORY_LABEL } });
    if (!before) return;
    await db.sectionDiscount.update({ where: { category: category as keyof typeof CATEGORY_LABEL }, data: { active: false, percent: 0, startsAt: null, endsAt: null } });
    await audit(admin.id, "section_discount_removed", "section_discount", category, {
      summary: `Desconto removido de ${CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}`,
      before: before as unknown as Record<string, unknown>,
      after: { active: false, percent: 0 },
    });
  });
  refreshStore("catalog", "landing");
  revalidatePath("/admin/descontos");
}
