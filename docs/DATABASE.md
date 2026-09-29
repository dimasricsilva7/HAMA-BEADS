# Banco de dados

PostgreSQL via Prisma. Schema em `prisma/schema.prisma`; valores monetários sempre em **centavos (Int)**.

## Migrations
- Desenvolvimento: `npm run db:migrate:dev -- --name descricao`
- Produção: `npm run build` executa `prisma migrate deploy` automaticamente.
- `DATABASE_URL_UNPOOLED` (conexão direta) é usada pelas migrations.

## Seed (`npm run db:seed`)
Idempotente: cria o que não existe e **nunca sobrescreve** edições do admin.
- Kits Inicial (14k, R$ 49,90), Criador (24k, R$ 79,90), Profissional (48k, R$ 119,90) com composição do briefing.
- Biblioteca 500+ (R$ 19,90). Demais complementos (pegboards, pinças, 20/50/100 modelos, papel manteiga, fita) **inativos com preço 0** até o admin definir.
- Order bumps e upsells do briefing (ativos só os que têm produto com preço).
- Landing page (seções e textos), galeria com ilustrações provisórias, FAQ (respostas não confirmadas inativas com `[PREENCHER]`), modelos de mensagem, teste A/B de exemplo (inativo).

## Modelos
| Grupo | Tabelas |
|---|---|
| Admin | `AdminUser`, `AdminSession`, `LoginAttempt`, `AuditLog` (antes/depois) |
| Catálogo | `Product` (composição/especificações JSON, promoção com janela, digital, cross-sell), `PriceHistory` |
| Vendas | `Customer`, `Order` (snapshot do cliente/endereço, atribuição first/last touch, testes A/B, consentimento), `OrderItem` (snapshot de nome/preço/composição), `Payment`, `PaymentEvent` (linha do tempo), `WebhookEvent` (idempotência), `DigitalAccess`, `Coupon` |
| Ofertas | `OrderBump` (regra por produtos no carrinho), `Upsell` (sequência + regra), `UpsellEvent` (VIEW/ACCEPT/REJECT) |
| Analytics | `AnalyticsSession` (origem, dispositivo, variantes), `AnalyticsEvent`, `AdSpend`, `Experiment` |
| CMS | `LandingSection`, `GalleryItem`, `Faq`, `Review`, `Setting`, `MessageTemplate` |
| Infra | `JobLock` |

`product_variants` não foi criada: os kits não têm variações confirmadas (cor/tamanho). Se surgirem, adicione a tabela e o campo no `OrderItem`.

## Status do pedido
`PENDING` → `PIX_GENERATED` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`
Alternativos: `EXPIRED`, `CANCELLED`, `FAILED`, `REFUNDED`, `CHARGEBACK`. Etapas de entrega são definidas no admin; "pago" somente pelo gateway.
