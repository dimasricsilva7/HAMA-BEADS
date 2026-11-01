# Loja de calçados e acessórios — storefront + checkout PIX

Branch de desenvolvimento: feat/footwear-storefront.

Esta branch adapta a base técnica para uma loja independente de calçados e acessórios. A direção visual usa verde vibrante, branco, grafite e azul de apoio, com identidade própria. A loja não representa canal oficial da Crocs; marcas, logotipos e fotografias de terceiros só devem ser exibidos com autorização.

## Importação inicial do catálogo

No primeiro build de produção com o PostgreSQL conectado, o comando da Vercel é temporariamente configurado para executar:

```bash
npm run db:migrate && npm run catalog:sync && npm run build:local
```

A rotina importa as coleções Adulto, Infantil e Jibbitz em páginas, faz upsert por ID de origem e registra variantes e URLs das imagens. Após a sincronização inicial, o comando de build deve voltar para `npm run build` (Prisma Generate + migrations + Next.js).

## Vercel — projeto isolado

- Projeto: `footwear-storefront`
- Project ID: `prj_JnJoHs1yCcHwQByHHKaXhhc9hJ3H`
- Git: `dimasricsilva7/HAMA-BEADS`
- Branch de Preview: `feat/footwear-storefront`
- Node.js: 22.x
- Build: `npm run build:local` (gera Prisma + Next.js; não executa migrations automaticamente)
- Região das Functions: `gru1` (São Paulo)

A integração Git da Vercel está configurada para aceitar builds somente da branch `feat/footwear-storefront`; outras branches são ignoradas para não publicar por engano o app legado de Hama Beads. O banco PostgreSQL ainda precisa ser conectado separadamente ao projeto novo antes de validar o fluxo de checkout.

## Identidade visual\n\n- Paleta independente: verde #84BD00, branco #FFFFFF, grafite #444444, azul #006DA4 e verde-claro #F2F7E8.\n- Nome, logotipo próprio e banner editáveis no Admin → Configurações → Loja.\n- Paleta editável no Admin → Configurações → Aparência.\n\n## Funcionalidades

- Loja responsiva com home promocional, vitrines por categoria, busca e catálogo.
- Página de produto com galeria, preço, descrição, especificações, estoque e produtos relacionados.
- Categorias de calçados: Clogs, Sandálias, Slides, Infantil, Acessórios e Calçados.
- Painel administrativo para catálogo, fotos, banner principal, conteúdo e configurações da loja.
- Desconto percentual por seção, desconto individual por produto, campanhas com período e auditoria.
- O preço efetivo é calculado no servidor e reaplicado no carrinho e no checkout.
- Monitor "Clientes online": página atual, origem, UTM/campanha, dispositivo, navegador e última atividade; identificadores anônimos.
- Checkout próprio com PIX BravoPay e webhooks assinados, além do módulo de crediário baseado em protocolo, herdados da base existente.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Prisma 6 · PostgreSQL · Vercel.

## Desenvolvimento local

Instale dependências, copie o arquivo .env.example para .env e configure DATABASE_URL e DATABASE_URL_UNPOOLED de um banco DE DESENVOLVIMENTO isolado. Depois rode npm run db:generate, npm run db:migrate, npm run db:seed e npm run dev.

O seed desta branch é intencionalmente vazio. Não cadastramos preços, catálogo, avaliações ou estoque fictícios. Crie produtos reais em /admin/produtos e envie imagens próprias/licenciadas pelo painel.

## Área administrativa

- /admin: receita, pedidos, ticket médio, funil e relatórios.
- /admin/produtos: cadastro, imagens, descrição, categoria, estoque, preço e desconto individual.
- /admin/descontos: campanha percentual por seção, datas, prévia de preço e exceções individuais.
- /admin/ao-vivo: visitantes ativos, página, origem, UTM, dispositivo e atividade recente.
- /admin/configuracoes?aba=loja: nome da loja, logo, banner principal, contatos e identidade.
- /admin/configuracoes?aba=aparencia: paleta da loja.

## Regras de preço

1. O preço base nunca é sobrescrito ao aplicar um desconto.
2. O desconto individual do produto tem prioridade sobre o percentual da seção.
3. Percentuais não são acumulados.
4. Promoção por preço fixo concorre com o percentual; o menor preço elegível é aplicado.
5. O cálculo é repetido no orçamento do carrinho e no checkout no servidor.
6. O pedido mantém snapshot dos valores para preservar o histórico.

## Pagamentos

A integração BravoPay existente fica em src/lib/payments/bravopay.ts e src/lib/payments/index.ts. O estado de pagamento só muda após confirmação validada pelo backend/webhook. O crediário existente fica em src/lib/crediario.ts e no fluxo de pedidos; os dados sensíveis são protegidos no servidor.

Nunca configure tokens da BravoPay ou chaves privadas em variáveis NEXT_PUBLIC_*. Não use BRAVOPAY_MODE=mock em produção.

## Importante antes do deploy

O script de build deste projeto executa prisma migrate deploy. Configure um banco separado para Preview/branch e outro para Production. Não use o banco de produção do HAMA BEADS para testar esta branch. A documentação anterior do projeto registra que Preview e Production compartilhavam o banco Neon; confirme a separação em Vercel antes de habilitar deploy automático ou testar o checkout.

Não publicamos nem executamos cobranças nesta branch. Depois de configurar banco, variáveis privadas, frete, dados legais da empresa, gateway e catálogo real, rode npm run typecheck, npm run lint, npm test e npm run build.

Fotos, títulos, descrições, preços, avaliações, estoque e políticas comerciais devem representar a loja que efetivamente venderá os produtos. Use apenas ativos que você possui ou está autorizado a utilizar.


<!-- catalog-report-trigger -->
