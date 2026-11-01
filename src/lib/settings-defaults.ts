/**
 * Valores padrão das configurações da loja. Tudo é editável em Admin → Configurações.
 * Campos marcados com [PREENCHER] dependem de dados reais da empresa.
 */
export const SETTING_DEFAULTS: Record<string, string> = {
  // Loja
  store_name: "Sua Loja",
  store_tagline: "Calçados casuais e acessórios — revenda independente",
  logo_url: "",
  hero_banner_url: "",
  adult_banner_url: "",
  kids_banner_url: "",
  jibbitz_banner_url: "",
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
  theme_primary: "#84BD00",
  theme_secondary: "#F2F7E8",
  theme_accent: "#006DA4",
  theme_ink: "#444444",
  theme_background: "#FFFFFF",
  // Layout
  announcement_text: "Loja independente. Não somos a loja oficial da Crocs.",
  header_cta_label: "Ver coleção",
  sticky_cta_enabled: "true",
  sticky_cta_label: "EXPLORAR COLEÇÃO",
  footer_text: "",
  // Checkout
  require_cpf: "true",
  shipping_flat_cents: "0",
  shipping_free_threshold_cents: "0",
  shipping_note: "",
  pix_expiration_minutes: "30",
  checkout_note: "",
  // Confiança/urgência no checkout (CNPJ usa company_document; razão social usa company_name)
  checkout_reservation_minutes: "15",
  // Forma de pagamento — PIX (exibição no checkout)
  pix_enabled: "true",
  pix_method_label: "PIX",
  pix_badge: "aprovação imediata",
  pix_description: "Aprovação imediata. O QR Code e o código copia e cola serão gerados na próxima tela.",
  pix_button_label: "Gerar PIX",
  // Forma de pagamento — Crediário (protocolo próprio, NÃO é cartão). Desativado até configurar.
  crediario_enabled: "true",
  crediario_method_label: "Crediário",
  crediario_method_subtitle: "Em até {parcelas}x · com seu protocolo",
  crediario_section_title: "Pagar com crediário",
  crediario_description: "Informe o protocolo, a validade e os 3 últimos dígitos do CPF vinculado. A equipe da loja confere as informações antes de confirmar o pedido.",
  crediario_protocol_label: "Número do protocolo",
  crediario_protocol_placeholder: "Digite os 16 dígitos do seu protocolo",
  crediario_protocol_digits: "16",
  crediario_protocol_help: "",
  crediario_protocol_error: "Informe os {n} dígitos do protocolo (somente números).",
  crediario_validity_label: "Validade do protocolo",
  crediario_validity_placeholder: "MM/AA",
  crediario_validity_format: "MM/AA",
  crediario_validity_error: "Informe a validade no formato {formato}.",
  crediario_validity_expired_error: "Este protocolo está vencido. Confira a validade.",
  crediario_validity_reject_expired: "true",
  crediario_cpf_label: "3 últimos dígitos do CPF",
  crediario_cpf_placeholder: "Digite os 3 últimos dígitos",
  crediario_cpf_digits: "3",
  crediario_cpf_error: "Informe os {n} últimos dígitos do CPF.",
  crediario_installments_label: "Parcelamento",
  crediario_installments_description: "",
  crediario_max_installments: "2",
  crediario_installment_text: "{n}x de {valor}",
  crediario_help_text: "",
  crediario_error_message: "Não foi possível registrar seu pedido no crediário. Confira os dados e tente novamente.",
  crediario_success_title: "Solicitação recebida",
  crediario_success_message: "Recebemos seu pedido pelo crediário. A equipe verificará o protocolo e entrará em contato pelos dados informados.",
  crediario_info_message: "Nenhum valor é cobrado agora. O pedido fica aguardando a conferência do protocolo pela equipe da loja.",
  crediario_button_label: "Enviar pedido para análise",
  crediario_security_text: "As informações do protocolo são armazenadas criptografadas e usadas somente para validar sua solicitação.",
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
  seo_title: "Sua Loja — Calçados e acessórios",
  seo_description:
    "Confira calçados e acessórios para diferentes momentos. Encontre seu modelo, escolha o tamanho e compre com segurança.",
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
