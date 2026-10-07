/**
 * Valores padrão das configurações da loja. Tudo é editável em Admin → Configurações.
 * Campos marcados com [PREENCHER] dependem de dados reais da empresa.
 */
export const SETTING_DEFAULTS: Record<string, string> = {
  // Loja
  store_name: "Hama Beads",
  store_tagline: "Kits completos para criar Pixel Art em casa",
  logo_url: "",
  favicon_url: "",
  company_name: "",
  company_document: "",
  contact_email: "",
  contact_phone: "",
  whatsapp: "",
  address: "",
  support_hours: "",
  instagram_url: "",
  tiktok_url: "",
  facebook_url: "",
  youtube_url: "",
  // Aparência (tokens do design system — edição limitada)
  theme_primary: "#2F4BFF",
  theme_secondary: "#FFC53D",
  theme_accent: "#FF4F8B",
  theme_ink: "#17142E",
  theme_background: "#FFF9F0",
  // Layout
  announcement_text: "",
  header_cta_label: "Comprar",
  sticky_cta_enabled: "true",
  sticky_cta_label: "ESCOLHER MEU KIT",
  footer_text: "",
  // Checkout
  require_cpf: "true",
  shipping_flat_cents: "0",
  shipping_note: "",
  pix_expiration_minutes: "30",
  checkout_note: "",
  marketing_consent_label: "Aceito receber novidades e lembretes sobre meu pedido por WhatsApp e e-mail.",
  // E-mails transacionais (Resend)
  email_confirmation_enabled: "true",
  email_recovery_enabled: "true",
  email_checkout_enabled: "true",
  email_recovery_delay_minutes: "10",
  email_shipping_enabled: "true",
  // Rastreamento
  meta_pixel_enabled: "true",
  meta_pixel_id: "",
  meta_capi_enabled: "true",
  ga_enabled: "true",
  ga_id: "",
  cookie_banner_enabled: "true",
  // SEO
  seo_title: "Hama Beads — Kit completo para criar Pixel Art",
  seo_description:
    "Kits de Hama Beads de 24 a 96 cores, com até 59.600 peças, mini ferro, pegboard, pinças, acessórios para chaveiro e 100 modelos digitais. Pagamento via PIX.",
  og_image_url: "",
  // Políticas (texto editável — revise com seu jurídico)
  policy_privacy: `[PREENCHER] Política de Privacidade

Este texto é um modelo inicial e precisa ser revisado com os dados reais da empresa.

1. Quais dados coletamos
Nome, WhatsApp, e-mail, CPF (quando exigido para o PIX) e endereço de entrega, informados por você no checkout. Também registramos dados de navegação anônimos (páginas vistas, origem da visita e dispositivo) para entender o uso da loja.

2. Para que usamos
Processar e entregar seu pedido, gerar o pagamento PIX junto ao nosso processador de pagamentos, prestar atendimento e, somente com seu consentimento, enviar novidades.

3. Compartilhamento
Com o processador de pagamentos, com a transportadora responsável pela entrega e, se você aceitar cookies de marketing, com plataformas de anúncios (Meta, Google).

4. Seus direitos (LGPD)
Você pode solicitar acesso, correção ou exclusão dos seus dados pelo e-mail de contato da loja.

5. Contato do controlador
[PREENCHER razão social, CNPJ e e-mail].`,
  policy_terms: `[PREENCHER] Termos de Uso

Este texto é um modelo inicial e precisa ser revisado com os dados reais da empresa.

Ao comprar nesta loja você concorda com as condições de venda, prazos e políticas publicadas. Preços e composição dos kits podem ser alterados sem aviso, sem afetar pedidos já realizados. Produtos digitais são de uso pessoal e não podem ser revendidos ou redistribuídos.`,
  policy_returns: `[PREENCHER] Política de Troca e Devolução

Este texto é um modelo inicial e precisa ser revisado com os dados reais da empresa.

Compras online podem ser canceladas em até 7 dias corridos após o recebimento (art. 49 do Código de Defesa do Consumidor). Produtos com defeito podem ser trocados conforme a legislação. Para solicitar, entre em contato pelos canais de atendimento informando o número do pedido.

[PREENCHER prazos, forma de devolução e política para conteúdo digital já acessado].`,
  policy_cookies: `[PREENCHER] Política de Cookies

Usamos cookies essenciais para o funcionamento da loja (carrinho, sessão e segurança) e cookies de medição e marketing (Meta Pixel e Google Analytics) para medir e melhorar nossos anúncios. Os cookies de medição e marketing ficam ativos por padrão, e você pode recusá-los a qualquer momento pelo aviso de cookies ou pelo link "Preferências de cookies" no rodapé do site. Depois de recusar, nenhum dado da sua navegação ou compra é enviado ao Meta ou ao Google.`,
};

export const POLICY_PAGES = {
  "politica-de-privacidade": { key: "policy_privacy", title: "Política de Privacidade" },
  termos: { key: "policy_terms", title: "Termos de Uso" },
  "trocas-e-devolucoes": { key: "policy_returns", title: "Política de Troca e Devolução" },
  cookies: { key: "policy_cookies", title: "Política de Cookies" },
} as const;
