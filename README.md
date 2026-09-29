# Hama Beads — loja, checkout PIX e analytics

Aplicação completa para vender kits de **Hama Beads**: landing page mobile-first de alta conversão, catálogo, carrinho, checkout próprio com **PIX via BravoPay**, order bumps, upsells pós-compra, cross-sell, entrega digital, analytics próprio (funil, aquisição, cliques, preço), Meta Pixel + Conversions API, GA4 e painel administrativo com CMS e auditoria.

**Stack:** Next.js 15 (App Router, Server Components) · TypeScript · Tailwind CSS · Prisma 6 · PostgreSQL (Neon) · Zod · Vercel (hosting, Blob, Cron).

## Início rápido

```bash
npm install
cp .env.example .env           # preencha DATABASE_URL, AUTH_SECRET, ADMIN_* etc.
npm run db:migrate             # aplica as migrations
npm run db:seed                # produtos, landing, FAQ, galeria (idempotente)
npm run dev                    # http://localhost:3000  ·  admin em /admin
```

Para testar o fluxo de pagamento sem cobrança real, use `BRAVOPAY_MODE=mock` (bloqueado em produção) e defina `BRAVOPAY_WEBHOOK_SECRET`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | Desenvolvimento, build de produção (gera Prisma e aplica migrations), servidor |
| `npm run typecheck` · `lint` · `test` | TypeScript, ESLint, testes unitários (preço, cupom, A/B, assinatura de webhook, status) |
| `npm run test:e2e -- http://localhost:3000` | Funil completo real (UTMs → kit → bump → PIX → webhook → compra) |
| `npx tsx scripts/e2e-upsell.ts <url>` | Upsell pós-compra com novo PIX |
| `npx tsx scripts/e2e-admin.ts <url>` | Todas as páginas do admin + alteração de preço auditada |
| `npx tsx scripts/screenshots.ts <url> <dir>` | Screenshots + verificação de scroll horizontal (`WIDTHS=360,...,1920`) |
| `npm run admin:hash -- "senha"` | Gera `ADMIN_PASSWORD_HASH` do primeiro administrador |
| `npm run placeholders` | Regera as ilustrações provisórias em `public/placeholders` |

## Estrutura

```
prisma/                schema, migrations e seed
src/app/(site)/(store) landing, loja, produto, políticas, acompanhar pedido
src/app/(site)/(checkout) checkout e página do pedido (PIX, sucesso, upsell, downloads)
src/app/admin          painel (dashboard, funil, pedidos, produtos, CMS, relatórios…)
src/app/api            track, cart/quote, checkout, orders/status, upsell, webhooks/bravopay, cron, downloads
src/lib/payments       paymentService (interface única) + adaptador BravoPay
src/lib/analytics      eventos de servidor · src/lib/client/tracking.ts (navegador)
src/lib/meta           Conversions API
src/server             regras de negócio: cart (orçamento), orders, webhooks, jobs, catalog, reports
src/components         landing, carrinho, UI, admin
```

## Documentação

- [docs/SETUP.md](docs/SETUP.md) — ambiente local e variáveis
- [docs/DEPLOY.md](docs/DEPLOY.md) — Vercel, domínio, webhook, cron, logs
- [docs/DATABASE.md](docs/DATABASE.md) — modelo de dados, migrations, seed
- [docs/BRAVOPAY.md](docs/BRAVOPAY.md) — integração PIX, webhook, idempotência
- [docs/ADMIN.md](docs/ADMIN.md) — uso do painel e CMS
- [docs/ANALYTICS.md](docs/ANALYTICS.md) — eventos, funil, Pixel/CAPI/GA4, testes A/B
- [docs/PENDENCIAS.md](docs/PENDENCIAS.md) — dados comerciais ainda não definidos (TODO)

## Princípios

- **Nada comercial é inventado:** preços, composição, cores, dimensões, avaliações e selos vêm do admin. Complementos sem preço nascem inativos.
- **Preço sempre do servidor:** o navegador envia apenas IDs e quantidades; promoções, testes A/B, bumps e cupons são recalculados no checkout.
- **Pago só com confirmação do gateway:** webhook assinado (HMAC-SHA256) ou consulta à API. O frontend nunca altera status.
- **Histórico imutável:** pedidos guardam snapshot de nome, preço, composição, descontos, bumps, upsells e atribuição.
