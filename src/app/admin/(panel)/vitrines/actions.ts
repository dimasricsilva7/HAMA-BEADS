"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { refreshStore, withAdmin, type ActionResult } from "@/server/admin/guard";
import { parseHomeSectionSelection } from "@/lib/home-sections";

const LEGACY = ["BEADS", "PEGBOARD", "TWEEZERS", "DIGITAL_MODELS", "KIT"] as const;
const SECTION_NAMES = { black: "Ofertas Black", kids: "Infantil", adult: "Adulto", jibbitz: "Jibbitz" } as const;

export async function saveHomeSections(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("ADMIN", async (admin) => {
    const selection = parseHomeSectionSelection(String(fd.get("selection") ?? ""));
    if (!selection) return { error: "Não foi possível interpretar a seleção. Atualize a página e tente novamente." };

    const ids = Object.values(selection).flat();
    if (ids.some((id) => id.length > 40)) return { error: "Um dos produtos selecionados tem um identificador inválido." };
    const uniqueIds = [...new Set(ids)];
    // O mesmo modelo pode aparecer em mais de uma vitrine; duplicatas dentro de cada seção já são removidas pelo parser.

    if (uniqueIds.length) {
      const valid = await db.product.findMany({
        where: { id: { in: uniqueIds }, active: true, priceCents: { gt: 0 }, category: { notIn: [...LEGACY] } },
        select: { id: true },
      });
      if (valid.length !== uniqueIds.length) return { error: "Um produto selecionado foi desativado ou está sem preço. Atualize a seleção antes de salvar." };
    }

    const key = "home_section_products";
    const before = await db.setting.findUnique({ where: { key } });
    const value = JSON.stringify(selection);
    await db.setting.upsert({
      where: { key },
      update: { value, updatedBy: admin.email },
      create: { key, value, updatedBy: admin.email },
    });
    await audit(admin.id, "home_sections_updated", "settings", null, {
      summary: `Vitrines da home atualizadas: ${Object.entries(selection).map(([section, selected]) => `${SECTION_NAMES[section as keyof typeof SECTION_NAMES]} (${selected.length})`).join(", ")}`,
      before: { home_section_products: before?.value ?? null },
      after: { home_section_products: selection },
    });
    refreshStore("catalog", "settings");
    revalidatePath("/admin/vitrines");
    revalidatePath("/");
    return { ok: true, message: "Vitrines salvas. A página inicial já usa a nova seleção, sem precisar de deploy." };
  });
}
