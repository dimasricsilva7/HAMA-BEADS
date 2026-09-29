# Pendências — informações comerciais a definir (TODO)

Nada abaixo foi inventado; tudo é configurável no admin.

## Produto
- [ ] Quantidade de cores de cada kit (Produtos → Números exibidos → Cores)
- [ ] Tamanho das peças (Produtos → Especificações) e ativar a FAQ correspondente
- [ ] Dimensões dos pegboards tradicional e maior
- [ ] Modelo/especificação da ferramenta de fusão e o que são os "acessórios do kit"
- [ ] Fotos e vídeo reais dos kits (as imagens atuais são ilustrações marcadas como "Ilustração")
- [ ] Arquivo/link dos 100 modelos inclusos e da biblioteca 500+ (Produtos → Produto digital) e texto de entrega

## Preços
- [ ] Pegboard tradicional, pegboard grande, kit 2 pegboards, pinça, kit de pinças, 20/50/100 modelos, papel manteiga, fita dupla face → definir preço e ativar
- [ ] Revisar bumps e upsells (vários nascem inativos porque o produto não tem preço)

## Empresa e operação
- [ ] Razão social, CNPJ, endereço, e-mail, WhatsApp, horário (Configurações → Loja)
- [ ] Políticas de privacidade, termos, trocas e cookies (Configurações → Políticas) — revisar com jurídico
- [ ] Frete (Configurações → Checkout) e prazos reais de entrega
- [ ] FAQ de atendimento e compra avulsa de pegboards/pinças

## Integrações
- [ ] BravoPay: `BRAVOPAY_API_KEY`, `BRAVOPAY_WEBHOOK_SECRET`, cadastrar webhook
- [ ] Meta Pixel ID + `META_ACCESS_TOKEN`; GA4 ID
- [ ] Vercel Blob para uploads
- [ ] Recuperação por e-mail/WhatsApp automatizada: estrutura pronta (modelos + opt-in), envio automático não implementado por decisão — requer provedor e consentimento
