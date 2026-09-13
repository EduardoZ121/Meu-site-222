# ADR-018 — Fase B: Kuteka Pay (motor de pagamento unificado)

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-015 · ADR-016 · ADR-017 · nova ordem PO 2026-08-05

## Context

A Fase A (ADR-017) consolidou a infraestrutura financeira transversal (ledger,
reembolsos, disputas, reconciliação, fraude, KAI, CRM, exportações e faturação).
Faltava **uma única arquitectura de pagamento** usada por _todos_ os módulos
(renda, reservas, mudança inteligente, concierge, contratos, avaliações, serviços
de prestadores e futuros). Até aqui, os pagamentos sandbox viviam em
`finance_create_sandbox_payment` / `finance_capture_sandbox_payment`, chamados
directamente por alguns módulos.

Objectivo: trocar Multicaixa/EMIS/Stripe/Wise mais tarde **não** deve exigir
reescrever módulos. A custódia mantém-se desligada (`custody_mode = none`).

## Decision

Migration `supabase/migrations/0022_kuteka_pay_engine.sql` introduz o motor
**Kuteka Pay**, de forma aditiva (Core v1 freeze respeitado).

### Princípios

- Módulos **nunca** chamam SDKs de gateway directamente — apenas RPCs
  `kuteka_pay_*` / `finance_*`.
- O **payment intent** é a única fonte de verdade de uma tentativa de pagamento.
- `purpose` / `module_code` / `reference_type` / `reference_id` ligam qualquer
  objecto de negócio ao pagamento.
- Interface do adaptador de gateway: **create → await → capture/fail → webhook**.
- `custody_mode = none` sempre nesta fase.
- O Super Admin configura gateway por omissão, gateway por país/módulo e flags de
  sandbox **sem código**.

### Esquema

- `finance_payment_intents` ganha: `module_code`, `purpose`, `reference_type`,
  `reference_id`, `adapter_code` (`sandbox|multicaixa|emis|stripe|wise|bank_transfer`),
  `idempotency_key` (único quando presente), `expires_at`, `captured_at`,
  `failed_at`, `failure_code`, `failure_message`.
- `finance_pay_events` — auditoria **append-only** do ciclo de vida do intent
  (`created`, `redirected`, `webhook`, `captured`, `failed`, `cancelled`,
  `expired`). RLS de leitura: dono do intent ou `finance.read`/`finance.manage`;
  escrita só via RPCs security definer.
- `finance_gateways` ganha `priority`, `is_default` (índice parcial único garante
  um só gateway por omissão) e `module_allowlist text[]` (null = todos os módulos).

### RPCs (security definer, grant a `authenticated`)

- `kuteka_pay_create_intent(p_product_code, p_module_code, p_purpose,
p_reference_type, p_reference_id, p_urgency_band, p_gateway_code,
p_idempotency_key, p_description, p_metadata)` — cota via `finance_quote_price`,
  escolhe o gateway (explícito ou o activo por omissão em sandbox, respeitando
  `module_allowlist` e país), cria intent + cobrança pendente no ledger +
  `pay_event` `created`. Devolve
  `{ ok, paymentIntentId, amount, currency, gateway, sandbox, clientAction }`;
  em sandbox `clientAction = { type: 'auto_capture_ready' }`. Idempotente por
  `idempotency_key`.
- `kuteka_pay_capture(p_intent_id)` — estado `succeeded`, ledger `captured`,
  fatura, `pay_event` `captured`. Idempotente se já `succeeded`.
- `kuteka_pay_fail(p_intent_id, p_code, p_message)` — estado `failed`.
- `kuteka_pay_cancel(p_intent_id)` — estado `cancelled`.
- `kuteka_pay_status(p_intent_id)` — legível pelo dono ou `finance.read`/`manage`;
  devolve o intent + eventos.
- `kuteka_pay_simulate_webhook(p_intent_id, p_event)` — **só sandbox**, para
  testes do Super Admin (`succeeded`/`failed`/`cancelled`/`expired`).
- `kuteka_pay_adapter_health()` — estatísticas por adaptador para o painel.
- `kuteka_pay_set_default_gateway(p_code)` — Super Admin define o adaptador base.

### Compatibilidade — wrappers (preferido)

`finance_create_sandbox_payment` e `finance_capture_sandbox_payment` passam a ser
**wrappers finos** que delegam em `kuteka_pay_create_intent` +
`kuteka_pay_capture`. Assim, os callers antigos (`create_smart_move_request`,
`activate_partner_plan`, painéis existentes) continuam a funcionar sem alteração.
O wrapper de criação **infere** o `module_code` a partir do prefixo do produto
(`smart_move.*` → `smart_move`, `partner.*` → `partner_plan`, `kuteka_plus.*` →
`plus`, etc.) e marca `purpose = 'legacy_sandbox'`. Não há RPC de pagamento
depreciada nesta fase — os antigos mantêm-se como camada de compatibilidade.

### Seeds

Prioridades dos gateways (`sandbox` 10, `multicaixa` 20, `emis` 30,
`bank_transfer` 40, `stripe` 50, `wise` 60) e `sandbox` como gateway por omissão
activo.

### Frontend

- `packages/validation`: schemas Zod (`kutekaPayCreateIntentSchema`,
  `kutekaPayIntentIdSchema`, `kutekaPayFailSchema`,
  `kutekaPaySimulateWebhookSchema`, `kutekaPaySetDefaultGatewaySchema`) e as
  listas canónicas `KUTEKA_PAY_MODULE_CODES` / `KUTEKA_PAY_ADAPTER_CODES` /
  `KUTEKA_PAY_WEBHOOK_EVENTS`.
- `apps/web/modules/finance/services/kuteka-pay-client.ts`: `createIntent`,
  `capture`, `fail`, `cancel`, `status`, `simulateWebhook`, `setDefaultGateway`,
  `fetchAdapterHealth`, `listIntents`, `listPayEvents` e o helper `createAndSettle`
  (cria + captura em sandbox). Devolvem sempre `{ ok, data/message }`.
- `apps/web/modules/finance/hooks/useKutekaPay.ts`: hook partilhado para módulos.
- Super Admin: novo separador **Kuteka Pay** (`super/PayEnginePanel.tsx`) — saúde
  dos adaptadores, criar intent de teste, simular webhook e definir gateway por
  omissão.
- `FinanceHubClient.tsx`: a activação sandbox do Kuteka Plus passa a usar
  `createAndSettle` (motor unificado) em vez do RPC sandbox directo.

## Consequences

- Uma só arquitectura de pagamento para todos os módulos: adicionar renda,
  reservas ou concierge reutiliza `kuteka_pay_*` sem esquema novo.
- Trocar de gateway é configuração (Super Admin), não código de módulo.
- Sem custódia/escrow; o dinheiro segue para os gateways numa fase comercial
  futura (Fase C).
- **Ordem do roteiro:** Fase B (esta) unifica o pagamento; Fases C/D (escrow
  opcional e automação de payouts; conformidade AGT/SAF-T) assentam sobre esta.
- O export estático inclui o separador Kuteka Pay em `prebuilt/web-out`.
