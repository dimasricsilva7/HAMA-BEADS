# Setup local

## Requisitos
- Node.js 20+ (testado com 24) e npm
- PostgreSQL — recomendado Neon (`npx neon@latest claim create` cria um banco gratuito temporário)

## Passo a passo
1. `npm install` — no npm 11, aprove os scripts de instalação se solicitado (`prisma`, `@prisma/engines`, `esbuild`).
2. `cp .env.example .env` e preencha:
   - `DATABASE_URL` (pooled) e `DATABASE_URL_UNPOOLED` (direta)
   - `AUTH_SECRET` — `openssl rand -hex 32`
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD_HASH` — `npm run admin:hash -- "senha-com-12+-caracteres"`
   - `BRAVOPAY_MODE=mock` e `BRAVOPAY_WEBHOOK_SECRET=qualquer-valor-local` para testar sem cobrança
   - `CRON_SECRET` — qualquer valor aleatório
3. `npm run db:migrate && npm run db:seed`
4. `npm run dev` → loja em http://localhost:3000, admin em http://localhost:3000/admin

## Primeiro administrador
Não existe senha fixa no código. Enquanto não houver usuário com o e-mail de `ADMIN_EMAIL`, o login compara a senha com `ADMIN_PASSWORD_HASH` e cria o usuário **OWNER** no banco. Depois disso, novos usuários são criados em **Admin → Usuários** e a variável pode ser removida.

## Uploads
Com `BLOB_READ_WRITE_TOKEN`, o admin envia arquivos direto do navegador para o Vercel Blob (inclusive vídeos grandes). Sem ele, em desenvolvimento os arquivos vão para `public/uploads` (ignorado pelo git). Em produção o Blob é obrigatório — o servidor da Vercel não tem disco persistente.

## Testando o fluxo de pagamento (modo mock)
1. Compre qualquer kit — o PIX gerado é fictício (`MOCK-PIX-HAMA-...`).
2. No admin, abra o pedido → **Simular pagamento (teste)**: envia um webhook assinado pelo mesmo caminho de produção.
3. Ou rode `npm run test:e2e -- http://localhost:3000`.

> O `/api/track` descarta navegadores headless (filtro de bots). Os scripts E2E usam um user-agent real de celular.
