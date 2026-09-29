import type { Product } from "@prisma/client";
import { Card, Field, inputCls, textareaCls } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/client";
import { ComponentsEditor, GalleryEditor, MediaInput, ProductMultiSelect, SpecsEditor } from "@/components/admin/inputs";
import { CATEGORY_LABEL, FULFILLMENT_LABEL, STOCK_LABEL } from "@/lib/domain";
import { centsToInput, toLocalInput } from "@/server/admin/forms";
import { saveProduct } from "./actions";

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function ProductForm({ product, all }: { product: Product | null; all: { id: string; name: string; active: boolean }[] }) {
  const p = product;
  const others = all.filter((x) => x.id !== p?.id);
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
          <Card title="Informações">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" className="sm:col-span-2"><input name="name" required defaultValue={p?.name ?? ""} className={inputCls} /></Field>
              <Field label="Slug (URL)" hint="gerado do nome se vazio"><input name="slug" defaultValue={p?.slug ?? ""} className={inputCls} /></Field>
              <Field label="SKU"><input name="sku" defaultValue={p?.sku ?? ""} className={inputCls} /></Field>
              <Field label="Categoria">
                <select name="category" defaultValue={p?.category ?? "KIT"} className={inputCls}>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Tipo de entrega">
                <select name="fulfillment" defaultValue={p?.fulfillment ?? "PHYSICAL"} className={inputCls}>
                  {Object.entries(FULFILLMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Descrição curta" className="sm:col-span-2"><textarea name="shortDescription" rows={2} defaultValue={p?.shortDescription ?? ""} className={textareaCls} /></Field>
              <Field label="Descrição completa" className="sm:col-span-2" hint="Parágrafos separados por linha em branco. Links: [texto](/caminho)"><textarea name="description" rows={5} defaultValue={p?.description ?? ""} className={textareaCls} /></Field>
            </div>
          </Card>

          <Card title="Números exibidos (deixe vazio se não confirmado)">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Field label="Peças"><input name="beadCount" inputMode="numeric" defaultValue={p?.beadCount ?? ""} className={inputCls} /></Field>
              <Field label="Cores"><input name="colorCount" inputMode="numeric" defaultValue={p?.colorCount ?? ""} className={inputCls} /></Field>
              <Field label="Pegboards"><input name="pegboardCount" inputMode="numeric" defaultValue={p?.pegboardCount ?? ""} className={inputCls} /></Field>
              <Field label="Modelos"><input name="modelCount" inputMode="numeric" defaultValue={p?.modelCount ?? ""} className={inputCls} /></Field>
            </div>
          </Card>

          <Card title="Composição (o que vem no produto)">
            <ComponentsEditor name="components" defaultValue={arr(p?.components)} />
            <p className="mt-2 text-xs text-slate-500">Tipos: beads, pegboard, tweezers (pinça), tool (ferro/ferramenta), accessory, digital, bonus. Não informe o que não foi confirmado.</p>
          </Card>

          <Card title="Especificações">
            <SpecsEditor name="specs" defaultValue={arr(p?.specs)} />
            <p className="mt-2 text-xs text-slate-500">Ex.: tamanho das peças, dimensões do pegboard, potência do ferro — somente dados confirmados.</p>
          </Card>

          <Card title="Imagens e vídeo">
            <div className="space-y-4">
              <MediaInput name="imageUrl" label="Imagem principal" defaultValue={p?.imageUrl} folder="produtos" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Galeria</p>
                <GalleryEditor name="gallery" defaultValue={arr(p?.gallery)} />
              </div>
              <MediaInput name="videoUrl" label="Vídeo" accept="video/*" defaultValue={p?.videoUrl} folder="videos" />
            </div>
          </Card>

          <Card title="Produto digital">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <MediaInput name="digitalFileUrl" label="Arquivo ou link de acesso (privado)" accept=".pdf,.zip,image/*" defaultValue={p?.digitalFileUrl} folder="digital" />
                <p className="mt-1 text-xs text-slate-500">Nunca aparece no site: o cliente acessa por um link seguro, validado a cada download.</p>
              </div>
              <Field label="Limite de downloads" hint="vazio = ilimitado"><input name="digitalMaxDownloads" inputMode="numeric" defaultValue={p?.digitalMaxDownloads ?? ""} className={inputCls} /></Field>
              <Field label="Validade do acesso (dias)" hint="vazio = sem prazo"><input name="digitalValidityDays" inputMode="numeric" defaultValue={p?.digitalValidityDays ?? ""} className={inputCls} /></Field>
              <Field label="Como o cliente recebe (texto exibido)" className="sm:col-span-2"><input name="digitalDeliveryNote" defaultValue={p?.digitalDeliveryNote ?? ""} placeholder="Ex.: Arquivo PDF com os modelos, disponível na página do pedido." className={inputCls} /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Preço">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço (R$)"><input name="price" required inputMode="decimal" defaultValue={centsToInput(p?.priceCents ?? 0)} className={inputCls} /></Field>
              <Field label="Preço anterior (R$)" hint="Só use se o preço anterior for real."><input name="compareAt" inputMode="decimal" defaultValue={centsToInput(p?.compareAtPriceCents)} className={inputCls} /></Field>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase text-slate-500">Promoção real (opcional)</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="Preço promocional"><input name="promoPrice" inputMode="decimal" defaultValue={centsToInput(p?.promoPriceCents)} className={inputCls} /></Field>
              <Field label="Texto"><input name="promoLabel" defaultValue={p?.promoLabel ?? ""} placeholder="Ex.: Semana das crianças" className={inputCls} /></Field>
              <Field label="Início"><input type="datetime-local" name="promoStartsAt" defaultValue={toLocalInput(p?.promoStartsAt)} className={inputCls} /></Field>
              <Field label="Fim"><input type="datetime-local" name="promoEndsAt" defaultValue={toLocalInput(p?.promoEndsAt)} className={inputCls} /></Field>
            </div>
            <p className="mt-2 text-xs text-slate-500">A promoção vale só entre as datas. Não há contagem regressiva automática.</p>
          </Card>

          <Card title="Publicação">
            <div className="space-y-3">
              {check("active", "Ativo (visível na loja)", p?.active ?? false)}
              {check("featured", "Destaque (kit em evidência)", p?.featured ?? false)}
              <Field label="Selo" hint='"Mais escolhido" só com dados reais de vendas (veja Relatórios → Produtos).'>
                <input name="badge" list="badges" defaultValue={p?.badge ?? ""} className={inputCls} />
                <datalist id="badges"><option value="Mais completo" /><option value="Mais escolhido" /><option value="Recomendado" /></datalist>
              </Field>
              <Field label="Ordem"><input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className={inputCls} /></Field>
              <Field label="Estoque">
                <select name="stockStatus" defaultValue={p?.stockStatus ?? "IN_STOCK"} className={inputCls}>
                  {Object.entries(STOCK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Quantidade em estoque" hint="vazio = sem controle de quantidade"><input name="stockQuantity" inputMode="numeric" defaultValue={p?.stockQuantity ?? ""} className={inputCls} /></Field>
            </div>
          </Card>

          <Card title="Cross-sell">
            <p className="mb-2 text-xs text-slate-500">Sugerir no &quot;Complete seu kit&quot; quando este produto estiver no carrinho:</p>
            <ProductMultiSelect name="crossSellIds" products={others} defaultValue={arr(p?.crossSellIds)} />
            <p className="mb-2 mt-4 text-xs text-slate-500">Já inclusos neste produto (nunca oferecer como bump/upsell/cross-sell):</p>
            <ProductMultiSelect name="includedProductIds" products={others} defaultValue={arr(p?.includedProductIds)} />
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
        <SubmitButton>{p ? "Salvar alterações" : "Criar produto"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
