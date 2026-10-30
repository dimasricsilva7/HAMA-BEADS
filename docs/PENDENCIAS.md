# Checklist de preparação — loja de calçados

Esta branch é uma adaptação independente da base HAMA-BEADS. Não é a loja oficial de nenhuma fabricante e não contém fotos, logotipos ou textos de marcas de terceiros.

## Catálogo comercial — preencher com dados reais

- [ ] Definir nome comercial, logotipo e favicon próprios em Admin → Configurações → Loja.
- [ ] Enviar o banner principal em Admin → Configurações → Loja.
- [ ] Cadastrar produtos em Admin → Produtos.
- [ ] Inserir fotos originais ou licenciadas, nome, descrição e especificações confirmadas.
- [ ] Cadastrar tamanhos, cores e estoque de cada SKU conforme o controle adotado pela operação.
- [ ] Confirmar preços, preço de referência, descontos e disponibilidade.
- [ ] Cadastrar políticas de entrega, prazo, troca, devolução e privacidade com dados reais da empresa.
- [ ] Informar razão social, CNPJ, endereço, e-mail e canais de atendimento.

## Descontos e analytics

- [ ] Configurar descontos por seção em Admin → Descontos.
- [ ] Configurar exceções individuais nos produtos.
- [ ] Conferir a prévia, a janela da campanha e o preço no carrinho/checkout.
- [ ] Confirmar consentimento e política de privacidade para analytics/marketing.

## Checkout e infraestrutura

- [ ] Criar banco PostgreSQL isolado para Preview/branch.
- [ ] Criar banco PostgreSQL de produção separado.
- [ ] Cadastrar DATABASE_URL e DATABASE_URL_UNPOOLED de cada ambiente separadamente na Vercel.
- [ ] Revisar BRAVOPAY_API_KEY e BRAVOPAY_WEBHOOK_SECRET no ambiente correto.
- [ ] Configurar o endpoint de webhook da BravoPay para a URL do site.
- [ ] Configurar frete, CEP, transportadora e prazos reais.
- [ ] Revisar configuração do crediário, regras, validade, parcelamento e textos de consentimento.
- [ ] Validar pagamentos no ambiente de testes do gateway, sem cobranças reais.
- [ ] Executar typecheck, lint, testes unitários e build.
- [ ] Só depois publicar em produção.

## Segurança importante

O histórico de deployment do projeto-base registra que Vercel Preview e Production compartilhavam o mesmo banco Neon. Não testar checkout, crediário, seed ou migrações em Preview até confirmar que DATABASE_URL e DATABASE_URL_UNPOOLED apontam para um banco de teste isolado. O build executa prisma migrate deploy.
