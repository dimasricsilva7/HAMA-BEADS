# Painel administrativo (`/admin`)

Acesso com sessão segura (cookie httpOnly, 12h, hash no banco), bcrypt, bloqueio após 5 falhas em 15 min. Papéis: **OWNER** (tudo + usuários), **ADMIN** (tudo exceto usuários), **EDITOR** (conteúdo e pedidos). Toda alteração fica em **Auditoria** com valor anterior e novo.

## Visão geral
- **Dashboard** — receita, pedidos, ticket médio, conversão, receita/visitante, PIX gerados/pagos/pendentes, checkout abandonado, order bump, upsell, investimento, ROAS, CPA, CAC; vendas por kit, origem, campanha e dispositivo. Filtros: hoje, ontem, 7/30 dias, mês, personalizado.
- **Funil** — visitantes → oferta → interação → kit → carrinho → checkout → PIX → PIX copiado → pago → compra, com volume, %, queda entre etapas e filtros por produto, origem, campanha e dispositivo.
- **PIX pendentes** — cliente, valor, produto, tempo desde a geração, origem, campanha e botão de WhatsApp com mensagem pronta (envio manual; nada é automático).

## Vendas
- **Pedidos** — busca/filtros; detalhe com itens (snapshot), linha do tempo, webhooks, jornada da sessão, atribuição, testes A/B, upsells; ações: consultar BravoPay, cancelar pendente, avançar entrega (em preparação/enviado/entregue + rastreio).
- **Clientes** — pedidos, valor total, último pedido, origem, produtos e eventos relevantes.
- **Cupons** — percentual/fixo, validade, limite de usos, pedido mínimo, produtos aplicáveis.

## Catálogo e ofertas
- **Produtos** — criar, editar, duplicar, ativar/desativar, excluir, reordenar. Composição (peças, pegboards, pinças, ferramenta, acessórios, digital, bônus), números exibidos, especificações, imagens/galeria/vídeo, promoção com datas, estoque, cross-sell e itens inclusos, entrega digital (link privado, limite, validade), SEO. Alterar preço registra histórico e auditoria e atualiza loja e checkout imediatamente.
- **Order bumps** — produto, preço, título, descrição, benefício, imagem, posição, ativo, regra "mostrar só se o carrinho contiver X". Sempre desmarcados por padrão.
- **Upsells** — sequência 1 → 2 → 3 com regras; nunca repete oferta aceita/recusada nem produto já comprado/incluso.
- **Testes A/B** — headline, CTA, imagem do hero, kit destacado, ordem das seções, order bump e **preço** (por kit). Resultados por variante: sessões, checkout, compras, conversão, receita por visitante.

## Relatórios
Aquisição (UTMs e click IDs com CPA/ROAS), Custos de anúncios (manual ou colar CSV), Cliques por elemento, Produtos e preço (views → compra, conversão por preço, ranking interno), Bumps e upsells (receita incremental).

## Conteúdo (CMS)
- **Landing page** — ativar/ocultar, reordenar e editar cada seção (título, subtítulo, texto, imagem, vídeo, CTA e campos próprios: indicadores do hero, passos, benefícios, públicos, oferta, 100 modelos, complementos, biblioteca 500+, selos de segurança).
- **Galeria** — imagem, título, categoria, ordem, ativo, "mostrar em O que você criaria?".
- **FAQ** — respostas com `[PREENCHER]` não podem ser publicadas.
- **Avaliações** — somente reais, com confirmação de autorização para publicar.

## Configurações
Loja (nome, logo, favicon, contatos, redes), aparência (cores do design system, barra de aviso, CTAs), checkout (CPF, frete, validade do PIX, opt-in), pixels e analytics, SEO, políticas, modelos de mensagem e diagnóstico do sistema.
