# Pendências — informações comerciais a definir (TODO)

Nada abaixo foi inventado; tudo é configurável no admin.

## Resolvido em 29/09/2026
- Kits 24/48/72/96 cores (16.400 / 30.800 / 45.200 / 59.600 peças) com preços e kit de ferramentas completo (`prisma/catalog-2026-09.ts`)
- Complementos: pegboard quadrado grande (R$ 19,99), pegboard retangular grande (R$ 34,98), refil 1.000 peças 24 cores com caixa (R$ 14,90)
- Order bumps e sequência de upsells reconfigurados com esses produtos
- BravoPay: chave de API em produção
- Meta: pixels 1110092494887723 e 1644516877230478 com Conversions API (`META_CAPI_TOKENS`)

## Confirmar
- [ ] **Dimensões dos pegboards** — as medidas informadas (50x50 cm, 90x90 cm, 1,20x70 cm) não combinam com peças de 2,6 mm; provavelmente são número de pinos. Preencher em Produtos → Especificações.
- [ ] Tamanho das peças: 2,6 mm (tirado do título do anúncio de referência) — confirmar
- [ ] Biblioteca 500+ modelos (R$ 19,90): confirmar que o conteúdo existe e cadastrar o arquivo/link (Produtos → Produto digital); senão, desativar o produto e o bump/upsell
- [ ] Arquivo/link dos 100 modelos inclusos nos kits

## Pendente
- [ ] **Webhook BravoPay**: a URL cadastrada está incompleta. Use `https://hama-beads-sepia.vercel.app/api/webhooks/bravopay` e envie o segredo `whsec_...` para `BRAVOPAY_WEBHOOK_SECRET` (enquanto isso, a confirmação acontece por consulta à API na página do PIX e pelos jobs)
- [ ] **Banco de produção (Neon)**: reivindicar/migrar antes de 02/10/2026 01:05 GMT
- [ ] Fotos e vídeo reais dos kits (as imagens atuais são ilustrações marcadas como "Ilustração")
- [ ] Avaliações reais de clientes (a seção só aparece com pelo menos uma aprovada)
- [ ] Razão social, CNPJ, endereço, e-mail, WhatsApp, horário (Configurações → Loja)
- [ ] Políticas (Configurações → Políticas) — revisar com jurídico
- [ ] Frete e prazos reais de entrega (Configurações → Checkout)
- [ ] GA4 (opcional)
