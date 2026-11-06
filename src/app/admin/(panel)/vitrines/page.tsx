import { db } from "@/lib/db";
import { getSettingsFresh } from "@/server/settings";
import { CATEGORY_LABEL } from "@/lib/domain";
import { defaultHomeSectionSelection, homeProductFamilyKey, parseHomeSectionSelection } from "@/lib/home-sections";
import { PageHeader } from "@/components/admin/ui";
import { HomeVitrinesEditor, type HomeVitrineCandidate } from "./HomeVitrinesEditor";

export const metadata = { title: "Vitrines da página inicial" };

export default async function HomeVitrinesPage() {
  const [settings, products] = await Promise.all([
    getSettingsFresh(),
    db.product.findMany({
      where: { active: true, priceCents: { gt: 0 }, category: { notIn: ["BEADS", "PEGBOARD", "TWEEZERS", "DIGITAL_MODELS", "KIT"] } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, name: true, sku: true, category: true, imageUrl: true, priceCents: true, listPriceCents: true,
        stockStatus: true, sourceCollectionId: true, sourceCollectionIds: true, homeBlackFriday: true, badge: true,
      },
    }),
  ]);

  const grouped = new Map<string, typeof products>();
  for (const product of products) {
    const key = homeProductFamilyKey(product);
    const group = grouped.get(key) ?? [];
    group.push(product);
    grouped.set(key, group);
  }

  const candidates: HomeVitrineCandidate[] = [...grouped.values()].map((group) => {
    const p = group[0];
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      categoryLabel: CATEGORY_LABEL[p.category] ?? p.category,
      imageUrl: p.imageUrl,
      priceCents: p.priceCents,
      colorCount: p.category === "JIBBITZ" ? 1 : group.length,
      stockStatus: p.stockStatus,
      sourceCollectionId: p.sourceCollectionId,
      sourceCollectionIds: Array.isArray(p.sourceCollectionIds) ? p.sourceCollectionIds.filter((id): id is string => typeof id === "string") : [],
      homeBlackFriday: p.homeBlackFriday,
      badge: p.badge,
      listPriceCents: p.listPriceCents,
    };
  });

  const initial = parseHomeSectionSelection(settings.home_section_products) ?? defaultHomeSectionSelection(candidates);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Vitrines da página inicial"
        description="Escolha exatamente quais modelos aparecem em Ofertas Black, Infantil, Adulto e Jibbitz. A ordem escolhida aqui é a ordem exibida na loja."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ofertas Black", "Produtos da campanha"],
          ["Infantil", "Modelos para crianças"],
          ["Adulto", "Clogs, sandálias e slides"],
          ["Jibbitz", "Pins e acessórios"],
        ].map(([title, detail]) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </div>
      <HomeVitrinesEditor candidates={candidates} initial={initial} />
    </div>
  );
}
