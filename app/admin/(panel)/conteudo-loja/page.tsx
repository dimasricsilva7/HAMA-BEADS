import { ActionForm, SubmitButton } from "@/components/admin/client";
import { PageHeader, inputCls, labelCls, textareaCls } from "@/components/admin/ui";
import { getSettingsFresh } from "@/server/settings";
import { saveSettings } from "../sistema-actions";

export const metadata = { title: "Textos da loja" };

type CopyField = { key: string; label: string; hint?: string; type?: "text" | "textarea" };
const GROUPS: { title: string; fields: CopyField[] }[] = [
  {
    title: "Avisos de loja independente / revenda",
    fields: [
      { key: "announcement_text", label: "Texto da faixa superior" },
      { key: "reseller_notice_home", label: "Aviso exibido na página inicial", type: "textarea" },
      { key: "reseller_notice_product", label: "Aviso exibido na página do produto", type: "textarea" },
      { key: "reseller_notice_footer", label: "Aviso exibido no rodapé", type: "textarea" },
    ],
  },
  {
    title: "Banner principal e Ofertas Black",
    fields: [
      { key: "home_hero_eyebrow", label: "Texto pequeno do banner" },
      { key: "home_hero_title", label: "Título principal", hint: "Use uma quebra de linha para separar as linhas." },
      { key: "home_hero_description", label: "Descrição do banner", type: "textarea" },
      { key: "home_hero_cta_label", label: "Texto do botão" },
      { key: "home_black_title", label: "Título da seção Ofertas Black" },
      { key: "home_black_description", label: "Descrição da seção Ofertas Black", type: "textarea" },
    ],
  },
  {
    title: "Vitrine Infantil",
    fields: [
      { key: "home_kids_title", label: "Título da seção" },
      { key: "home_kids_description", label: "Descrição", type: "textarea" },
      { key: "home_category_kids_label", label: "Texto sobre a imagem de categoria" },
    ],
  },
  {
    title: "Vitrine Adulto",
    fields: [
      { key: "home_adult_title", label: "Título da seção" },
      { key: "home_adult_description", label: "Descrição", type: "textarea" },
      { key: "home_category_adult_label", label: "Texto sobre a imagem de categoria" },
    ],
  },
  {
    title: "Vitrine e chamadas de Jibbitz",
    fields: [
      { key: "home_jibbitz_title", label: "Título da seção Jibbitz" },
      { key: "home_jibbitz_description", label: "Descrição da seção Jibbitz", type: "textarea" },
      { key: "home_jibbitz_banner_eyebrow", label: "Texto pequeno do banner Jibbitz" },
      { key: "home_jibbitz_banner_title", label: "Título do banner Jibbitz" },
      { key: "home_jibbitz_banner_description", label: "Descrição do banner Jibbitz", type: "textarea" },
      { key: "home_jibbitz_banner_cta", label: "Botão do banner Jibbitz" },
      { key: "home_jibbitz_rail_title", label: "Título do carrossel de produtos" },
      { key: "home_jibbitz_rail_description", label: "Texto auxiliar do carrossel", type: "textarea" },
      { key: "home_category_jibbitz_label", label: "Texto sobre a imagem de categoria" },
      { key: "product_jibbitz_title", label: "Título do incremento na página do produto" },
      { key: "product_jibbitz_description", label: "Descrição do incremento na página do produto", type: "textarea" },
    ],
  },
];

export default async function StoreCopySettingsPage() {
  const settings = await getSettingsFresh();
  const keys = GROUPS.flatMap((group) => group.fields.map((field) => field.key));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Textos da loja"
        description="Edite chamadas, descrições e avisos de loja independente/revenda sem alterar o código. As alterações são salvas no banco e aparecem na loja sem novo deploy."
      />
      <ActionForm action={saveSettings} className="space-y-5">
        <input type="hidden" name="__keys" value={keys.join(",")} />
        {GROUPS.map((group) => (
          <section key={group.title} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
            </header>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <label htmlFor={field.key} className={labelCls}>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea id={field.key} name={field.key} rows={3} defaultValue={settings[field.key] ?? ""} className={textareaCls} />
                  ) : (
                    <input id={field.key} name={field.key} defaultValue={settings[field.key] ?? ""} className={inputCls} />
                  )}
                  {field.hint && <p className="mt-1 text-xs text-slate-500">{field.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
          <SubmitButton>Salvar textos da loja</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
