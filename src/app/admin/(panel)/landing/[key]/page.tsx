import { notFound } from "next/navigation";
import { Card, Field, PageHeader, inputCls, textareaCls } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/client";
import { IconItemsEditor, MediaInput, ProductMultiSelect, StatsEditor, StepsEditor, StringListEditor } from "@/components/admin/inputs";
import { SECTION_TYPES, type SectionType } from "@/lib/domain";
import { SPRITE_KEYS, SPRITES } from "@/lib/pixel-art";
import { db } from "@/lib/db";
import { saveSection } from "../../cms-actions";

export const metadata = { title: "Editar seção" };

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default async function EditSectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [section, products] = await Promise.all([db.landingSection.findUnique({ where: { key } }), db.product.findMany({ select: { id: true, name: true, active: true }, orderBy: { sortOrder: "asc" } })]);
  if (!section) notFound();
  const c = (section.config ?? {}) as Record<string, unknown>;
  const t = section.type;
  const spriteSelect = (
    <Field label="Ilustração pixel (usada quando não há imagem)">
      <select name="cfg_spriteKey" defaultValue={s(c.spriteKey)} className={inputCls}>
        <option value="">—</option>
        {SPRITE_KEYS.map((k) => <option key={k} value={k}>{SPRITES[k].name}</option>)}
      </select>
    </Field>
  );
  const productSelect = (label: string) => (
    <Field label={label}>
      <select name="cfg_productId" defaultValue={s(c.productId)} className={inputCls}>
        <option value="">—</option>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.active ? "" : " (inativo)"}</option>)}
      </select>
    </Field>
  );

  return (
    <div>
      <PageHeader title={section.label} description={`Tipo: ${SECTION_TYPES[t as SectionType] ?? t}`} />
      <ActionForm action={saveSection} className="space-y-6">
        <input type="hidden" name="key" value={section.key} />
        <Card title="Conteúdo">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium md:col-span-2"><input type="checkbox" name="active" defaultChecked={section.active} className="h-4 w-4" /> Seção ativa</label>
            <Field label="Título" className="md:col-span-2"><input name="title" defaultValue={section.title ?? ""} className={inputCls} /></Field>
            <Field label="Subtítulo" className="md:col-span-2"><textarea name="subtitle" rows={2} defaultValue={section.subtitle ?? ""} className={textareaCls} /></Field>
            {["product_in_use", "models_included"].includes(t) && (
              <Field label="Texto" className="md:col-span-2" hint="Parágrafos separados por linha em branco. Links: [texto](/caminho)"><textarea name="body" rows={4} defaultValue={section.body ?? ""} className={textareaCls} /></Field>
            )}
            <Field label="Texto do CTA"><input name="ctaLabel" defaultValue={section.ctaLabel ?? ""} className={inputCls} /></Field>
            <Field label="Destino do CTA" hint="#kits, #faq, /loja…"><input name="ctaTarget" defaultValue={section.ctaTarget ?? ""} className={inputCls} /></Field>
            <div className="md:col-span-2"><MediaInput name="imageUrl" label="Imagem" defaultValue={section.imageUrl} folder="landing" /></div>
            {t === "video" && <div className="md:col-span-2"><MediaInput name="videoUrl" label="Vídeo mobile (vertical) — arquivo MP4 ou link YouTube/Vimeo" accept="video/*" defaultValue={section.videoUrl} folder="videos" /></div>}
          </div>
        </Card>

        {(t === "hero" || t === "video" || t === "benefits" || t === "trust" || t === "how_it_works" || t === "audience" || t === "offer" || t === "models_included" || t === "complete_kit" || t === "library" || t === "product_in_use" || t === "final_cta") && (
          <Card title="Configuração da seção">
            <div className="grid gap-4 md:grid-cols-2">
              {t === "hero" && (
                <>
                  <Field label="Selo superior"><input name="cfg_eyebrow" defaultValue={s(c.eyebrow)} className={inputCls} /></Field>
                  {spriteSelect}
                  <Field label="CTA secundário"><input name="cfg_secondaryCtaLabel" defaultValue={s(c.secondaryCtaLabel)} className={inputCls} /></Field>
                  <Field label="Destino do CTA secundário"><input name="cfg_secondaryCtaTarget" defaultValue={s(c.secondaryCtaTarget)} className={inputCls} /></Field>
                  <div className="md:col-span-2">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Indicadores (até 4) — somente números confirmados</p>
                    <StatsEditor name="cfg_stats" defaultValue={arr(c.stats)} />
                  </div>
                </>
              )}
              {(t === "product_in_use" || t === "final_cta") && spriteSelect}
              {t === "video" && (
                <>
                  <MediaInput name="cfg_desktopVideoUrl" label="Vídeo desktop (opcional)" accept="video/*" defaultValue={s(c.desktopVideoUrl)} folder="videos" />
                  <MediaInput name="cfg_posterUrl" label="Poster (capa)" defaultValue={s(c.posterUrl)} folder="videos" />
                  <p className="text-xs text-slate-500 md:col-span-2">Sem vídeo cadastrado, a seção não aparece na página. Eventos registrados: video_start, video_25, video_50, video_75, video_complete.</p>
                </>
              )}
              {(t === "benefits" || t === "trust") && <div className="md:col-span-2"><IconItemsEditor name="cfg_items" defaultValue={arr(c.items)} /></div>}
              {t === "how_it_works" && (
                <>
                  <div className="md:col-span-2"><StepsEditor name="cfg_steps" defaultValue={arr(c.steps)} /></div>
                  <Field label="Aviso de segurança" className="md:col-span-2"><textarea name="cfg_warning" rows={2} defaultValue={s(c.warning)} className={textareaCls} /></Field>
                </>
              )}
              {t === "audience" && (
                <>
                  {spriteSelect}
                  <Field label="Cor">
                    <select name="cfg_tone" defaultValue={s(c.tone) || "primary"} className={inputCls}><option value="primary">Primária</option><option value="accent">Destaque</option></select>
                  </Field>
                  <div className="md:col-span-2"><StringListEditor name="cfg_items" defaultValue={arr<string>(c.items)} addLabel="Adicionar tópico" /></div>
                </>
              )}
              {t === "offer" && productSelect("Produto em destaque (composição exibida)")}
              {t === "models_included" && (
                <>
                  <Field label="Como os modelos são entregues" className="md:col-span-2" hint="Não prometa formato/entrega que ainda não existe."><input name="cfg_deliveryNote" defaultValue={s(c.deliveryNote)} className={inputCls} /></Field>
                  <div className="md:col-span-2"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Ilustrações (chaves: {SPRITE_KEYS.join(", ")})</p><StringListEditor name="cfg_sprites" defaultValue={arr<string>(c.sprites)} /></div>
                </>
              )}
              {t === "complete_kit" && (
                <div className="md:col-span-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Produtos exibidos (nenhum = todos os complementos ativos)</p>
                  <ProductMultiSelect name="cfg_productIds" products={products} defaultValue={arr<string>(c.productIds)} />
                </div>
              )}
              {t === "library" && (
                <>
                  {productSelect("Produto da biblioteca")}
                  <div className="md:col-span-2"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Categorias exibidas</p><StringListEditor name="cfg_categories" defaultValue={arr<string>(c.categories)} /></div>
                </>
              )}
            </div>
          </Card>
        )}
        <SubmitButton>Salvar seção</SubmitButton>
      </ActionForm>
    </div>
  );
}
