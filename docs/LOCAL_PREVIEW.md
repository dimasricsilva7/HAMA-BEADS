# Prévia local da loja (sem PIX e sem cobranças)

Este guia inicia a branch `feat/footwear-storefront` no Windows, usando um PostgreSQL local exclusivo. Não conecta ao Neon ou ao banco de produção.

## 1. Pré-requisitos

- Node.js 22.x
- Git
- Docker Desktop iniciado no Windows

## 2. Obter a branch atual

No terminal do VS Code:

```powershell
git clone -b feat/footwear-storefront https://github.com/dimasricsilva7/HAMA-BEADS.git
cd HAMA-BEADS
npm ci
```

Se a pasta já existe:

```powershell
git switch feat/footwear-storefront
git pull origin feat/footwear-storefront
npm ci
```

## 3. Iniciar PostgreSQL local

```powershell
docker compose -f docker-compose.preview.yml up -d
```

A base fica em `localhost:54329`, no container `footwear-storefront-preview-db`. Ela é independente de qualquer banco hospedado.

## 4. Criar o .env local

Crie um arquivo chamado `.env` na raiz do projeto. Não o envie ao GitHub.

```env
DATABASE_URL="postgresql://footwear_preview:preview_local_only_change_me@localhost:54329/footwear_preview?schema=public"
DATABASE_URL_UNPOOLED="postgresql://footwear_preview:preview_local_only_change_me@localhost:54329/footwear_preview?schema=public"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="COLE_UM_SEGREDO_ALEATORIO"
CRON_SECRET="COLE_OUTRO_SEGREDO_ALEATORIO"
CHECKOUT_PREVIEW_ONLY="true"
EMAIL_PROVIDER="console"
```

Gere dois segredos diferentes:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Execute duas vezes e substitua os dois valores no `.env`.

Não configure `BRAVOPAY_API_KEY`, `BRAVOPAY_WEBHOOK_SECRET` ou `BRAVOPAY_MODE=mock`. O modo `CHECKOUT_PREVIEW_ONLY=true` mantém a tela do checkout visível, desabilita os botões e bloqueia a API que criaria pedido ou pagamento.

## 5. Criar tabelas e iniciar

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Mantenha o terminal aberto. Quando aparecer `Ready` e `Local: http://localhost:3000`, abra esse endereço no navegador.

## 6. Testar até o checkout

1. Navegue pela loja.
2. Depois de importar o catálogo de teste, abra produtos e selecione tamanho/cor.
3. Adicione ao carrinho e altere quantidades.
4. Confira o resumo e acesse o checkout.
5. Preencha os campos e confira o resumo/frete.
6. O botão final ficará desabilitado e identificado como prévia. Nenhum pedido, PIX ou cobrança será criado. A API também bloqueia qualquer chamada de envio enquanto `CHECKOUT_PREVIEW_ONLY=true`.

## 7. Parar a prévia

No terminal do Next.js, pressione `Ctrl+C`. Para parar o PostgreSQL local:

```powershell
docker compose -f docker-compose.preview.yml down
```

Para apagar também todos os dados locais de teste (irreversível):

```powershell
docker compose -f docker-compose.preview.yml down -v
```

Nunca use as URLs, senhas ou variáveis do ambiente de produção neste guia.
