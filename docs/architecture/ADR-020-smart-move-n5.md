# ADR-020 — Fase D1: Mudança Inteligente N5

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-015 · ADR-017 · ADR-018 · ADR-019 · nova ordem PO 2026-08-05

## Context

A Mudança Inteligente (migration `0020`) tinha apenas a criação do pedido com a
taxa de abertura cobrada por um caminho _sandbox_ próprio
(`finance_create_sandbox_payment`). Faltava o ciclo de negócio completo: o
matching pela Kuteka, a **taxa de sucesso** (só quando há solução aceite), a
recusa, a falha com **reembolso por urgência** e o cancelamento com devolução.

As Fases A/B/C consolidaram a infraestrutura financeira transversal (ADR-017), o
motor de pagamento unificado **Kuteka Pay** (ADR-018) e o padrão operacional do
marketplace (ADR-019: `service_order_events`, `p_amount_override`, timeline
append-only, RPCs security definer). A Fase D1 fecha a Mudança Inteligente
reutilizando exactamente esta fundação — **nenhum caminho de pagamento isolado**.

## Decision

Migration `supabase/migrations/0024_smart_move_n5.sql` (aditiva, Core v1 freeze
respeitado) fecha o ciclo N5.

### Máquina de estados

```
draft → awaiting_payment → active → matched → completed
                                        │
                    matched → accept (cobra sucesso) → completed
                    matched → reject → active
   active | matched → fail (reembolso por urgência) → failed
   draft | awaiting_payment | active → cancel (reembolso integral) → cancelled
```

### Pontos de pagamento (motor unificado Kuteka Pay)

- **Abertura (`opening_fee`)** — cobrada no arranque em `create_smart_move_request`
  via `kuteka_pay_create_intent(product = 'smart_move.open', module = 'smart_move',
purpose = 'opening_fee', reference_type = 'smart_move_request', reference_id =
<request>)`. Em sandbox captura de imediato (`kuteka_pay_capture`) e activa o
  pipeline (efeitos).
- **Sucesso (`success_fee`)** — cobrada **apenas** quando o cliente aceita a
  solução (`smart_move_accept_match`), via `kuteka_pay_create_intent(product =
'smart_move.success', purpose = 'success_fee', urgency_band = <banda>)`. Sem
  match aceite não há taxa de sucesso.

Ambas usam produtos e regras de preço por urgência já semeados na migration `0019`
(`smart_move.open` / `smart_move.success`). O payment intent continua a ser a
única fonte de verdade; a cobrança entra no `finance_ledger_entries` como sempre.

### Reembolsos / créditos (política por urgência)

Reutilizam as tabelas genéricas `finance_refunds` + `finance_credit_accounts` +
`finance_credit_transactions` + Ledger. Como `finance_create_refund` /
`finance_grant_credits` exigem `finance.manage` do chamador (o que barraria um
cliente a cancelar), o reembolso de smart move passa por um helper interno
`smart_move_credit_refund` (security definer, revogado de `public`) que aplica a
_mesma_ mecânica de créditos. Os RPCs que o chamam já autorizam o actor.

- **Falha (`smart_move_fail`)** — reembolso **parcial** da abertura em créditos,
  por urgência: `emergency_14` 100 %, `urgent_30` 75 %, `priority_60` 60 %,
  `planned_90` 50 %.
- **Cancelamento antes do match (`smart_move_cancel`)** — devolução **integral**
  (100 %) da abertura em créditos, se já tiver sido cobrada.

### SLA por urgência

Prazo-limite de matching a partir da criação (`smart_move_sla_hours`, dias úteis
× 8 h — valores razoáveis N5):

| Urgência       | Horas | Reembolso na falha |
| -------------- | ----- | ------------------ |
| `planned_90`   | 720   | 50 %               |
| `priority_60`  | 480   | 60 %               |
| `urgent_30`    | 240   | 75 %               |
| `emergency_14` | 120   | 100 %              |

`smart_move_check_slas` (finance.manage/admin, cron futuro) marca `sla_breached`
em pedidos `active`/`matched` fora do prazo.

### Esquema

- `smart_move_requests` ganha: `opening_amount_aoa`, `success_amount_aoa`,
  `success_charged_at`, `matched_at`, `completed_at`, `failed_at`, `cancelled_at`,
  `failure_reason`, `sla_hours`, `sla_due_at`, `sla_breached`, `accepted_match`,
  `match_notes`. A check de `status` já cobria todos os estados N5.
- `smart_move_events` — timeline **append-only** (`created`, `activated`,
  `matched`, `accepted`, `rejected`, `completed`, `cancelled`, `failed`,
  `refunded`, `sla_breached`, `note`). RLS de leitura: cliente dono ou operadores
  (`finance.manage`/`admin.panel`/`agent.operate`/`properties.manage`); escrita só
  via RPCs security definer (`smart_move_log_event`).

### RPCs (security definer, grant a `authenticated`)

- `smart_move_my_context()` — `canOperate` (agente/finance/admin) para a UI.
- `create_smart_move_request(...)` — **refactor** para Kuteka Pay (abertura);
  define `sla_due_at` por urgência; escreve eventos `created`/`activated`.
- `smart_move_match(p_request_id, p_matched_property_id, p_notes)` — operador;
  `active → matched`.
- `smart_move_accept_match(p_request_id)` — cliente; cobra sucesso via Kuteka Pay;
  `matched → completed`.
- `smart_move_reject_match(p_request_id, p_reason)` — cliente; `matched → active`.
- `smart_move_fail(p_request_id, p_reason)` — operador; `→ failed` + reembolso
  parcial por urgência; marca SLA.
- `smart_move_cancel(p_request_id, p_reason)` — cliente; `→ cancelled` +
  reembolso integral.
- `smart_move_check_slas()` — finance.manage/admin; marca breaches.
- Listagem continua por **RLS** (`smart_move_select`).

### Efeitos no arranque

Ao capturar a abertura: intenção de saída no contrato
(`set_contract_exit_intent`), `partner_notified_at`, `agent_task_created_at`,
notas KAI e menção de previsões financeiras actualizadas (registadas em
`kai_notes` — não há tabela de forecast dedicada em N5).

### Frontend

- `packages/validation/src/smart-move.ts`: schemas Zod
  (`smartMoveCreateSchema`, `smartMoveMatchSchema`, `smartMoveRejectSchema`,
  `smartMoveFailSchema`, `smartMoveCancelSchema`, `smartMoveRequestIdSchema`) e as
  listas canónicas `SMART_MOVE_STATUSES` / `SMART_MOVE_EVENT_TYPES`.
- `apps/web/modules/monetization/services/smart-move-client.ts`:
  `createSmartMoveRequest`, `matchSmartMove`, `acceptSmartMoveMatch`,
  `rejectSmartMoveMatch`, `failSmartMove`, `cancelSmartMove`,
  `fetchSmartMoveContext`, `listSmartMoveRequests`, `listSmartMoveEvents` — todos
  `{ ok, data/message }`.
- `SmartMoveClient.tsx` (`/app/mudanca`): criação, lista com badges de estado,
  montantes abertura/sucesso e estado de pagamento, cronologia por pedido; o
  cliente aceita/recusa o match, paga o sucesso (auto no accept) e cancela; o
  operador (`agent.operate`/`finance.manage`) regista match (id de imóvel em texto,
  aceitável em N5) e falha por SLA. Padrões `SoftListSlot`, `SessionStatusGate`,
  sem redesenho do shell.

## Consequences

- Ciclo da Mudança Inteligente fechado ponta a ponta reutilizando Ledger +
  Kuteka Pay + reembolsos/créditos; nenhum caminho de pagamento isolado.
- A taxa de sucesso é orientada a resultado (só quando há solução aceite),
  alinhando incentivos com a Arquitectura Financeira.
- O reembolso por urgência protege a confiança do cliente quando o SLA falha,
  reutilizando as tabelas de reembolso/créditos genéricas.
- Sem custódia/escrow (`custody_mode = none`); gateways reais ficam para a fase
  comercial.
- O export estático inclui a Mudança Inteligente N5 em `prebuilt/web-out`.
