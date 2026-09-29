# Integração BravoPay (PIX)

Baseada na documentação oficial (https://bravopay.club/docs), consultada em 28/09/2026. Nenhum endpoint foi inventado.

## Arquitetura
- `src/lib/payments/bravopay.ts` — **adaptador**: HTTP, payload, assinatura. Único arquivo que conhece a BravoPay.
- `src/lib/payments/index.ts` — **`paymentService`**, interface usada pelo resto do sistema:
  - `createPixPayment()` · `getPaymentStatus()` · `handleWebhook()` · `refundPayment()`
- `src/server/orders.ts` → `applyPaymentSnapshot()` é o **único** ponto que altera o status de pagamento de um pedido.

## API usada
| Uso | Chamada documentada |
|---|---|
| Base / auth | `https://bravopay.club/api/v1` · `Authorization: Bearer <BRAVOPAY_API_KEY>` |
| Criar PIX | `POST /transactions` com `amount_cents`, `method: "pix"`, `customer{name,email,cpf,phone}`, `description` (≤300), `external_reference` (≤120, = nº do pedido), `metadata` (≤20 chaves), `expires_in` (60–86400 s), `utm{source,medium,campaign,content,term,fbclid,gclid,ttclid}`, `product_id` (opcional) |
| Idempotência | header `Idempotency-Key: hama-<orderId>` (24h) |
| Consultar | `GET /transactions?external_reference=<nº do pedido>` |
| Resposta PIX | `pix.copy_paste` e `pix.expires_at` — **a BravoPay não retorna imagem de QR Code**; o QR é gerado localmente a partir do copia e cola |
| Valor mínimo | R$ 5,00 (500 centavos) — validado no checkout e nos upsells |
| Reembolso | **não documentado na API**. `refundPayment()` retorna erro explicativo; reembolse pelo painel BravoPay — o webhook `transaction.refunded` atualiza o pedido |

## Webhook `/api/webhooks/bravopay`
1. Lê o corpo **bruto**.
2. Valida `BravoPay-Signature` ou `X-Bravopay-Signature` no formato `t=<unix>,v1=<hex>`, HMAC-SHA256 de `` `${t}.${rawBody}` `` com `BRAVOPAY_WEBHOOK_SECRET`, comparação em tempo constante e tolerância de 5 min (anti-replay). **Sem assinatura válida → 401, nada é processado.**
3. Registra em `WebhookEvent` com `eventId` único → **idempotência**: duplicatas respondem 200 sem reprocessar (o contador `attempts` sobe).
4. Aplica o status: `transaction.paid → PAID`, `refunded → REFUNDED`, `chargeback → CHARGEBACK`, `expired → EXPIRED`, `failed → FAILED`, `created` (sem mudança), `receipt_uploaded` (registrado na linha do tempo).
5. Grava `previousStatus`, `newStatus`, `result`, pedido e transação. Em erro responde 500 → a BravoPay tenta de novo (até 8×); o job também reprocessa falhas.

Em `transaction.paid` são gravados `paid_at`, transação, valor pago, taxa (`fee_cents`), líquido (`net_cents`), provider, metadata e tracking.

## Regras de segurança
- Pedido só vira **pago** se o valor pago ≥ total do pedido (divergência fica registrada como alerta).
- Transições permitidas: pendente → pago/expirado/falhou; expirado/cancelado → pago (pagamento tardio); pago → reembolsado/contestação. Pago nunca volta para pendente.
- O botão "Já paguei" apenas antecipa a consulta à API; o navegador nunca define status.
- Efeitos de "pago" (acesso digital, uso de cupom, estoque, evento `purchase`, CAPI Purchase) rodam **uma única vez** (updates condicionais).

## Testes
- Unitários: `npm test` (assinatura válida/inválida/antiga, formato do payload, mapeamento de eventos).
- E2E: `npm run test:e2e` envia webhooks assinados, duplicados e com assinatura inválida.
- Modo `BRAVOPAY_MODE=mock`: PIX fictício (não pagável) + botão "Simular pagamento" no admin.
