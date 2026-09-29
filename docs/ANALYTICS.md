# Analytics, Pixel, CAPI e GA4

## Analytics próprio
- Navegador: `src/lib/client/tracking.ts` → fila em lote para `POST /api/track` (sendBeacon). Bots/headless são descartados; rate limit por IP; mesma origem obrigatória.
- Servidor: `src/lib/analytics` registra eventos críticos (PIX, pagamento, compra, upsell, abandono) ligados ao pedido.
- **Sessão** (`AnalyticsSession`): visitor_id (1 ano, cookie `hb_vid` definido já no middleware), session_id (30 min), landing page, referrer, UTMs (source/medium/campaign/content/term), fbclid/gclid/ttclid, canal, dispositivo, navegador, SO, variantes A/B.
- **Evento** (`AnalyticsEvent`): nome, página, produto, pedido, cliente, elemento, valor, metadata JSON, dispositivo/UTM copiados da sessão, timestamp.
- **Atribuição:** first-touch e last-touch em `localStorage`, enviados ao checkout e gravados no pedido (e herdados pelos upsells). `_fbc` é criado a partir do `fbclid`.

### Eventos
`page_view, landing_view, scroll_25/50/75/90, video_start/25/50/75/complete, gallery_open, gallery_interaction, inspiration_open, faq_open, product_view, kit_selected, cta_click, add_to_cart, remove_from_cart, cart_view, checkout_started, coupon_applied, order_bump_view/accept/reject, cross_sell_view/add, upsell_view/accept/reject, pix_generated, pix_copy, pix_error, payment_pending, payment_paid, purchase, checkout_abandoned, digital_download, cookie_consent`

`purchase` só é registrado quando o gateway confirma o pagamento, com o **valor realmente pago**.

### Cliques
Qualquer elemento com `data-cta="nome"` (e opcional `data-product`) gera `cta_click` — é a base do relatório de cliques.

## Meta Pixel + Conversions API
- Pixel ID em Admin → Configurações (ou `NEXT_PUBLIC_META_PIXEL_ID`); token CAPI **somente** em `META_ACCESS_TOKEN`.
- Eventos: PageView, ViewContent, AddToCart, InitiateCheckout (navegador + espelho CAPI com o mesmo `event_id`), AddPaymentInfo (navegador + CAPI no checkout), **Purchase** (CAPI no servidor após pagamento confirmado + Pixel na página do pedido com o mesmo `event_id = purchase_<orderId>` → deduplicação).
- Dados do usuário na CAPI com hash SHA-256 (e-mail, telefone, nome, cidade, UF, CEP, external_id) + fbc/fbp/IP/UA.
- Com o banner de cookies ativo, Pixel/GA/CAPI só funcionam após o aceite (o consentimento é gravado no pedido).

## GA4
ID em Admin → Configurações (ou `NEXT_PUBLIC_GA_ID`). Eventos: page_view, view_item, add_to_cart, begin_checkout, add_payment_info, purchase.

## Testes A/B
Atribuição determinística (hash FNV-1a de `experimento:visitor_id`): o servidor calcula a mesma variante na página e no checkout — um teste de preço nunca confia no navegador. A variante é salva na sessão, em cada evento (`props.exp`) e no pedido.

## Receita por visitante
O objetivo é maximizar receita por visitante (não cliques). Dashboard e testes A/B exibem RPV, AOV, conversão, taxa de bump/upsell, pagamento de PIX e, com custos cadastrados, CPA/CAC/ROAS.
