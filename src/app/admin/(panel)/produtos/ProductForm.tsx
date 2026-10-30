import type { Product } from "@prisma/client";
import { Card, Field, inputCls, textareaCls } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/client";
import { GalleryEditor, MediaInput, SpecsEditor } from "@/components/admin/inputs";
import { CATEGORY_LABEL, FULFILLMENT_LABEL, STOCK_LABEL } from "@/lib/domain";
import { centsToInput, toLocalInput } from "@/server/admin/forms";
import { saveProduct } from "./actions";

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function ProductForm({ product }: { product: Product | null; all?: { id: string; name: string; active: boolean }[] }) {
  const p = product;
  const check = (name: string, label: string, on: boolean) => (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={on} className="h-4 w-4" /> {label}
    </label>
  );

  return (
    <ActionForm action={saveProduct} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Informações do produto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" className="sm:col-span-2"><input name="name" required defaultValue={p?.name ?? ""} className={inputCls} /></Field>
              <Field label="Slug (URL)"><input name="slug" defaultValue={p?.slug ?? ""} className={inputCls} /></Field>
              <Field label="SKU"><input name="sku" defaultValue={p?.sku ?? ""} className={inputCls} /></Field>
              <Field label="Categoria">
                <select name="category" defaultValue={p?.category ?? "CLOGS"} className={inputCls}>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Tipo de produto">
                <select name="fulfillment" defaultValue={p?.fulfillment ?? "PHYSICAL"} className={inputCls}>
                  {Object.entries(FULFILLMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Descrição curta" className="sm:col-span-2"><textarea name="shortDescription" rows={2} defaultValue={p?.shortDescription ?? ""} className={textareaCls} /></Field>
              <Field label="Descrição completa" className="sm:col-span-2"><textarea name="description" rows={5} defaultValue={p?.description ?? ""} className={textareaCls} /></Field>
            </div>
          </Card>
          <Card title="Fotos e mídia">
            <div className="space-y-4">
              <MediaInput name="imageUrl" label="Foto principal do produto" defaultValue={p?.imageUrl} folder="produtos" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Galeria de fotos</p>
                <GalleryEditor name="gallery" defaultValue={arr(p?.gallery)} />
              </div>
              <MediaInput name="videoUrl" label="Vídeo do produto (opcional)" accept="video/*" defaultValue={p?.videoUrl} folder="videos" />
            </div>
          </Card>
          <Card title="Características e especificações">
            <SpecsEditor name="specs" defaultValue={arr(p?.specs)} />
            <p className="mt-2 text-xs text-slate-500">Use para registrar material, ajuste, tipo de sola, indicação de uso, instruções de cuidado e medidas confirmadas.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Preços e descontos">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço base (R$)"><input name="price" required inputMode="decimal" defaultValue={centsToInput(p?.priceCents ?? 0)} className={inputCls} /></Field>
              <Field label="Preço de referência (R$)" hint="Só informe um preço anterior verdadeiro."><input name="compareAt" inputMode="decimal" defaultValue={centsToInput(p?.compareAtPriceCents)} className={inputCls} /></Field>
              <Field label="Desconto individual (%)" hint="Prevalece sobre o desconto da categoria. Vazio = herdar categoria."><input name="individualDiscountPercent" type="number" min="0" max="100" step="1" inputMode="numeric" defaultValue={p?.individualDiscountPercent ?? ""} placeholder="Ex.: 25" className={inputCls} /></Field>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase text-slate-500">Promoção por preço fixo (opcional)</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="Preço promocional (R$)"><input name="promoPrice" inputMode="decimal" defaultValue={centsToInput(p?.promoPriceCents)} className={inputCls} /></Field>
              <Field label="Nome da campanha"><input name="promoLabel" defaultValue={p?.promoLabel ?? ""} placeholder="Ex.: Oferta especial" className={inputCls} /></Field>
              <Field label="Início"><input type="datetime-local" name="promoStartsAt" defaultValue={toLocalInput(p?.promoStartsAt)} className={inputCls} /></Field>
              <Field label="Fim"><input type="datetime-local" name="promoEndsAt" defaultValue={toLocalInput(p?.promoEndsAt)} className={inputCls} /></Field>
            </div>
            <p className="mt-2 text-xs text-slate-500">O desconto percentual não acumula com outro desconto: prevalece o menor preço calculado.</p>
          </Card>
          <Card title="Estoque e publicação">
            <div className="space-y-3">
              {check("active", "Produto ativo na loja", p?.active ?? false)}
              {check("featured", "Destacar na página inicial", p?.featured ?? false)}
              <Field label="Selo do produto"><input name="badge" defaultValue={p?.badge ?? ""} placeholder="Ex.: Lançamento, Oferta" className={inputCls} /></Field>
              <Field label="Ordem na vitrine"><input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className={inputCls} /></Field>
              <Field label="Disponibilidade">
                <select name="stockStatus" defaultValue={p?.stockStatus ?? "IN_STOCK"} className={inputCls}>
                  {Object.entries(STOCK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Quantidade em estoque"><input name="stockQuantity" inputMode="numeric" defaultValue={p?.stockQuantity ?? ""} placeholder="Vazio = não controlar" className={inputCls} /></Field>
            </div>
          </Card>
          <Card title="SEO">
            <div className="space-y-3">
              <Field label="Título (até 70)"><input name="seoTitle" maxLength={70} defaultValue={p?.seoTitle ?? ""} className={inputCls} /></Field>
              <Field label="Descrição (até 170)"><textarea name="seoDescription" maxLength={170} rows={3} defaultValue={p?.seoDescription ?? ""} className={textareaCls} /></Field>
            </div>
          </Card>
        </div>
      </div>
      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <SubmitButton>{p ? "Salvar alterações" : "Cadastrar produto"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
