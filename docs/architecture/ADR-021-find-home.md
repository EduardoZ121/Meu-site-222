# ADR-021 — Fase D2: Encontrar Casa

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-017 · ADR-018 · ADR-019 · ADR-020

## Context

Explorar imóveis permanece gratuito, mas clientes também precisam de uma procura
assistida e prioritária. Este fluxo deve reutilizar Ledger, Kuteka Pay,
reembolsos/créditos e o padrão operacional append-only, sem criar pagamentos
isolados ou custódia.

## Decision

A migration aditiva `supabase/migrations/0025_find_home.sql` introduz
`find_home_requests` e `find_home_events`, com RLS por proprietário ou operador.

### Máquina de estados

```text
draft → awaiting_payment → active → matched → completed
                                  └ reject → active
active | matched → failed
draft | awaiting_payment | active → cancelled
```

O cliente cria, aceita/recusa um match e cancela. Operadores com permissões
existentes registam matches e falhas. Todos os passos relevantes são escritos em
`find_home_events`, formando uma cronologia append-only.

### Pagamento e reembolso

Existe uma única taxa `priority_fee`, cobrada no arranque pelo produto
`find_home.priority` através de `kuteka_pay_create_intent` e, no sandbox,
`kuteka_pay_capture`. O payment intent e o Ledger continuam a ser a fonte de
verdade. Aceitar uma casa não gera cobrança adicional.

Falha operacional ou cancelamento elegível gera reembolso integral pela
infraestrutura genérica de reembolsos/créditos. `custody_mode = none`; não existe
escrow nem retenção de fundos.

### RPCs e frontend

- `create_find_home_request`, `find_home_match`, `find_home_accept_match`,
  `find_home_reject_match`, `find_home_fail`, `find_home_cancel`,
  `find_home_check_slas` e `find_home_my_context`;
- schemas Zod em `packages/validation/src/find-home.ts`;
- cliente `{ ok, data/message }` em `find-home-client.ts`;
- `/app/encontrar-casa` usa `SessionStatusGate` e `SoftListSlot`, com formulário,
  badges, SLA, cronologia e acções separadas por actor.

## Consequences

- A procura prioritária é opcional e não altera a exploração gratuita.
- O ciclo completo usa apenas Ledger + Kuteka Pay + reembolsos/créditos.
- A timeline melhora auditabilidade operacional.
- Gateways reais e custódia continuam fora desta fase.
