# Deploy na Vercel

## 1. Projeto
- Importe o repositório GitHub na Vercel (framework Next.js detectado automaticamente).
- Build: `npm run build` (executa `prisma generate`, `prisma migrate deploy` e `next build`).
- Cada push na `main` gera deploy de produção; PRs geram **preview deployments**.
- Região das funções: `vercel.json` usa `iad1` (perto do banco Neon em us-east). Se o banco for para São Paulo (`aws-sa-east-1`), troque para `gru1`.

## 2. Variáveis de ambiente (Settings → Environment Variables)
Obrigatórias em produção: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `BRAVOPAY_API_KEY`, `BRAVOPAY_WEBHOOK_SECRET`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`.
Opcionais: `BRAVOPAY_PRODUCT_ID`, `META_ACCESS_TOKEN`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA_ID`, `META_TEST_EVENT_CODE`.

- **Preview:** use um banco separado (ou branch do Neon) e `BRAVOPAY_MODE=mock` para não gerar cobranças reais.
- **Produção:** `BRAVOPAY_MODE` é ignorado (modo mock bloqueado). Sem `BRAVOPAY_API_KEY`, o checkout responde 503 em vez de criar pedidos impagáveis.
- O diagnóstico fica em **Admin → Configurações → Sistema** (mostra presença, nunca valores).

## 3. Vercel Blob
Storage → Create → Blob → conecte ao projeto (cria `BLOB_READ_WRITE_TOKEN`).

## 4. Domínio
Settings → Domains → adicione o domínio e configure o DNS. Atualize `NEXT_PUBLIC_SITE_URL` e faça redeploy.

## 5. Webhook BravoPay
No painel BravoPay, cadastre `https://SEU-DOMINIO/api/webhooks/bravopay` com os eventos `transaction.*`, e copie o segredo para `BRAVOPAY_WEBHOOK_SECRET`. Detalhes em [BRAVOPAY.md](BRAVOPAY.md).

## 6. Jobs (cron)
- `vercel.json` agenda `/api/cron/all` diariamente (limite do plano Hobby).
- `.github/workflows/jobs.yml` chama o mesmo endpoint **a cada 10 minutos**. Configure os secrets do repositório `SITE_URL` e `CRON_SECRET`.
- Além disso, a página do PIX consulta o status e dispara uma reconciliação oportunista (no máx. 1×/min).
- Jobs: reconciliação de PIX pendentes na BravoPay, expiração de PIX vencidos, reprocessamento de webhooks com falha, limpeza de sessões e analytics > 13 meses.

## 7. Logs
Vercel → Project → Logs. Os logs são JSON de uma linha com `scope` (`checkout`, `payment`, `webhook`, `cron`, `analytics`, `admin`, `meta-capi`) e dados sensíveis mascarados.

## Checklist pós-deploy
- [ ] `/admin/login` → entrar com o e-mail/senha do bootstrap
- [ ] Configurações → Sistema sem variáveis obrigatórias ausentes
- [ ] Preencher dados reais da empresa, políticas e contatos (ver [PENDENCIAS.md](PENDENCIAS.md))
- [ ] Compra real de valor baixo (ex.: produto de teste de R$ 5,00) → webhook recebido em Admin → Webhooks
- [ ] Meta: Gerenciador de Eventos com `META_TEST_EVENT_CODE` → PageView/ViewContent/AddToCart/InitiateCheckout/Purchase deduplicados
