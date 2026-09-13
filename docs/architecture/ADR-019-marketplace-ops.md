# ADR-019 — Fase C: Marketplace Operacional

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-015 · ADR-017 · ADR-018 · nova ordem PO 2026-08-05

## Context

As Fases A (ADR-017) e B (ADR-018) consolidaram a infraestrutura financeira
transversal e o motor de pagamento unificado **Kuteka Pay**. O marketplace de
prestadores (migration `0020`) só tinha a criação de pedido — sem orçamento,
aceitação, execução, pagamento, avaliação, comissão de resultado nem SLA.

Objectivo: fechar o **ciclo operacional completo** do prestador reutilizando a
_mesma_ infraestrutura financeira (Ledger + Kuteka Pay). Nenhum caminho de
pagamento isolado — o pagamento de um serviço é um payment intent do motor
unificado. Custódia continua desligada (`custody_mode = none`).

## Decision

Migration `supabase/migrations/0023_marketplace_ops.sql` (aditiva, Core v1 freeze
respeitado) introduz a operação completa do marketplace.

### Máquina de estados do pedido

```
requested → quoted → accepted → in_progress → completed
                                                  │
                            completed → pago (Kuteka Pay) → avaliado
qualquer estado não terminal → cancelled     (disputed reservado)
```

### Esquema

- `service_orders` ganha: `quoted_amount_aoa`, `quoted_at`, `quote_notes`,
  `accepted_at`, `started_at`, `sla_hours` (default 48), `sla_due_at`,
  `sla_breached`, `rating_score` (check 1–5), `rating_comment`, `rated_at`. A
  check de `status` passa a incluir `disputed`.
- `service_order_events` — timeline **append-only** (`created`, `quoted`,
  `accepted`, `started`, `completed`, `paid`, `rated`, `cancelled`, `disputed`,
  `sla_breached`, `note`). RLS de leitura: cliente dono, prestador dono ou
  `finance.manage`/`admin.panel`; escrita só via RPCs security definer.

### Pagamento pelo motor unificado (nenhum caminho isolado)

`marketplace_pay_order` chama `kuteka_pay_create_intent` com
`module_code = 'marketplace'`, `reference_type = 'service_order'`,
`reference_id = <order>` e o produto genérico `marketplace.service`. Em sandbox
(`clientAction = auto_capture_ready`) captura de imediato via `kuteka_pay_capture`.

Para usar o **valor negociado** em vez do preço de catálogo, o
`kuteka_pay_create_intent` ganhou um parâmetro genérico e opcional
`p_amount_override numeric` (limpo para todos os módulos — contratos à medida,
etc.). O intent continua a ser a única fonte de verdade e a cobrança entra no
`finance_ledger_entries` como sempre. A **comissão** B2B (provider → platform)
é escrita no Ledger com estado a seguir o pagamento (`pending`→`captured`).

### RPCs (security definer, grant a `authenticated`)

- `marketplace_my_context()` — prestadores que o utilizador pode operar +
  capacidade de gestão (para decidir o separador «Pedidos recebidos»).
- `marketplace_list_providers(p_category)` — lista `{ ok, data }` (RLS já cobre).
- `marketplace_create_order(p_provider_id, p_title, p_category, p_description,
p_property_id, p_sla_hours)` — cliente; estado `requested`, define `sla_due_at`,
  escreve evento. A comissão **não** nasce aqui — nasce no pagamento.
- `marketplace_submit_quote(p_order_id, p_amount, p_notes)` — prestador dono /
  `finance.manage` / admin em demos; estado `quoted`.
- `marketplace_accept_quote(p_order_id)` — cliente dono; estado `accepted`.
- `marketplace_start_order(p_order_id)` — prestador; estado `in_progress`.
- `marketplace_complete_order(p_order_id)` — prestador; estado `completed`,
  avalia SLA (`sla_breached`).
- `marketplace_pay_order(p_order_id, p_gateway_code)` — cliente; Kuteka Pay +
  comissão no Ledger; liga `payment_intent_id` ao pedido.
- `marketplace_cancel_order(p_order_id, p_reason)` — cliente/prestador/gestor.
- `marketplace_rate_order(p_order_id, p_score, p_comment)` — cliente após
  conclusão; actualiza a média de avaliação do prestador.
- `marketplace_check_slas()` — `finance.manage`/`admin`; marca breaches
  (`now > sla_due_at` e estado não terminal). Cron futuro.
- Eventos escritos em cada transição via `marketplace_log_event`.
- `create_service_order` passa a ser um **wrapper** de `marketplace_create_order`
  (nome antigo mantido; se um valor for indicado à cabeça, é registado como
  orçamento imediato).

### Prestadores demo (testar o lado prestador)

Dois prestadores demo (`Limpeza Express Luanda`, `Mudanças Angola Pro`) recebem
`user_id = demo.parceiro@kuteka.local` no seed, para que ao entrar como parceiro
demo apareça o separador «Pedidos recebidos» e se possa orçamentar/iniciar/concluir.
Em alternativa, `finance.manage`/`admin.panel` (ex.: `demo.super`) podem operar
qualquer prestador `is_demo` nas RPCs — sem contas falsas adicionais.

### Seeds

- Produto `marketplace.service` (categoria `marketplace`) + regra de preço base
  `marketplace_default` 25 000 AOA (`on_completion`); o valor real vem do override
  do orçamento aceite.
- A flag `marketplace` já existe (migration `0020`).

### Frontend

- `packages/validation/src/marketplace.ts`: schemas Zod
  (`marketplaceCreateOrderSchema`, `marketplaceSubmitQuoteSchema`,
  `marketplacePayOrderSchema`, `marketplaceRateOrderSchema`, …) e a lista canónica
  `MARKETPLACE_ORDER_STATUSES`. `kutekaPayCreateIntentSchema` ganha `amountOverride`.
- `apps/web/modules/monetization/services/marketplace-client.ts`: `createOrder`,
  `submitQuote`, `acceptQuote`, `startOrder`, `completeOrder`, `payOrder`,
  `cancelOrder`, `rateOrder`, `fetchMarketplaceContext`, `listMyOrders`,
  `listProviderInbox`, `listOrderEvents` — todos `{ ok, data/message }`.
- `MarketplaceClient.tsx`: UI operacional por separadores **Prestadores | Os meus
  pedidos | Pedidos recebidos** (este último só para prestadores/gestores). O
  cliente cria pedido → vê estado → aceita orçamento → paga via Kuteka Pay →
  avalia; o prestador orçamenta → inicia → conclui. Padrões `SoftListSlot`,
  `SessionStatusGate`, sem redesenho do shell.
- `kuteka-pay-client.ts` passa `p_amount_override` ao criar intents.

## Consequences

- Ciclo do marketplace fechado ponta a ponta reutilizando Ledger + Kuteka Pay;
  nenhum caminho de pagamento isolado.
- `p_amount_override` é genérico: qualquer módulo pode cobrar um valor negociado
  sem esquema novo, mantendo o intent como fonte de verdade.
- Sem custódia/escrow; payouts reais ficam para a fase comercial (gateways reais).
- SLA e avaliação alimentam confiança e reputação do prestador.
- O export estático inclui o marketplace operacional em `prebuilt/web-out`.
